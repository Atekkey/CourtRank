# AJT: I ran
# $ npm install -g firebase-tools
# $ firebase init
# TODO: $ firebase deploy

# Start emulator $ firebase emulators:start --only functions,firestore

from firebase_functions import https_fn, firestore_fn
from firebase_functions.options import set_global_options
from firebase_admin import initialize_app
from cloudevents.http import CloudEvent
from firebase_admin import firestore
from numpy import exp as npexp, std as npstd
from math import ceil
import bcrypt

set_global_options(max_instances=10)

initialize_app()

def expVal(ratingMe, ratingOpp):
    return 1 / (1 + 10 ** ((ratingOpp - ratingMe) / 400))

def teamRatingChange(teamA, teamB, kFactor):
    avgA, avgB = sum(teamA) / len(teamA), sum(teamB) / len(teamB)
    expA = [expVal(playerA, avgB) for playerA in teamA]
    expB = [expVal(playerB, avgA) for playerB in teamB]
    changeA = [round(kFactor * (1 - expA[i])) for i in range(len(expA))]
    changeB = [round(kFactor * (0 - expB[i])) for i in range(len(expB))]
    return changeA, changeB

def teamUpdateRating(ratingA, ratingB, kFactor):
    changeA, changeB = teamRatingChange(ratingA, ratingB, kFactor)
    A = [ratingA[i] + changeA[i] for i in range(len(ratingA))]
    B = [ratingB[i] + changeB[i] for i in range(len(ratingB))]
    return A, B

def calculateK(teamA = None, teamB = None, baseK=40):
    if teamA is None or teamB is None:
        return baseK
    try:
        highStd = max(npstd(teamA), npstd(teamB)) # Get highest std
        sigmoid = lambda x: 1 / (1 + npexp(-x))
        stdAdj = ((-1 * sigmoid(highStd / 100)) + 1.5)  # Get sigmoid such that higher std gives lower value 
        # Adjusted such that range is (0.5 to 1), then (-0.5 to -1) then (1 to 0.5)
        ret = ceil(baseK * stdAdj) # mult that factor [0,1] by baseK
        if ret < baseK//3:
            return baseK//3
        if ret > baseK:
            return baseK
        return ret
    except:
        return baseK

@firestore_fn.on_document_created(
    document="matches/{matchId}",
    timeout_sec=300,
    memory=256
)
def on_match_created(event: firestore_fn.Event[firestore_fn.DocumentSnapshot | None]) -> None:
    if not event.data:
        return

    match_data = event.data.to_dict()
    if match_data.get("processed", False):
        return

    leagueID = match_data["league_id"]
    league_k_factor = match_data.get("league_k_factor", 40)

    winTeamMap = match_data["win_team"]
    loseTeamMap = match_data["loss_team"]

    winPairs = [[pair[0], pair[1]["elo"]] for pair in winTeamMap.items()]
    losePairs = [[pair[0], pair[1]["elo"]] for pair in loseTeamMap.items()]

    winInput = [pair[1] for pair in winPairs]
    loseInput = [pair[1] for pair in losePairs]

    avgWin, avgLose = sum(winInput) / len(winInput), sum(loseInput) / len(loseInput)

    new_k_factor = calculateK(winInput, loseInput, baseK=league_k_factor)
    winOutput, loseOutput = teamUpdateRating(winInput, loseInput, new_k_factor)

    db = firestore.client()
    match_ref = event.data.reference
    league_ref = db.collection("leagues").document(leagueID)

    @firestore.transactional
    def update_in_transaction(transaction):
        # Re-check processed status inside transaction for idempotency
        match_snapshot = match_ref.get(transaction=transaction)
        if match_snapshot.to_dict().get("processed", False):
            return False

        league_doc = league_ref.get(transaction=transaction)
        if not league_doc.exists:
            print(f"League document {leagueID} does not exist")
            return False

        league_data = league_doc.to_dict()
        if "elo_info" not in league_data:
            league_data["elo_info"] = {}

        for i in range(len(winPairs)):
            pid = winPairs[i][0]
            newElo = int(winOutput[i])

            if pid not in league_data["elo_info"]:
                print(f"{pid} WINNER NOT IN LEAGUE")
                continue

            league_data["elo_info"][pid]["elo"] = newElo
            league_data["elo_info"][pid]["wins"] += 1

            if league_data["elo_info"][pid].get("opp_elo_sum") is None:
                league_data["elo_info"][pid]["opp_elo_sum"] = avgLose
            else:
                league_data["elo_info"][pid]["opp_elo_sum"] += avgLose

        for i in range(len(losePairs)):
            pid = losePairs[i][0]
            newElo = int(loseOutput[i])

            if pid not in league_data["elo_info"]:
                print(f"{pid} LOSER NOT IN LEAGUE")
                continue

            league_data["elo_info"][pid]["elo"] = newElo
            league_data["elo_info"][pid]["losses"] += 1

            if league_data["elo_info"][pid].get("opp_elo_sum") is None:
                league_data["elo_info"][pid]["opp_elo_sum"] = avgWin
            else:
                league_data["elo_info"][pid]["opp_elo_sum"] += avgWin

        # Atomic update - both succeed or both fail
        transaction.update(match_ref, {"processed": True})
        transaction.set(league_ref, league_data)
        return True

    transaction = db.transaction()
    update_in_transaction(transaction)


@https_fn.on_call(timeout_sec=300, memory=256)
def rollback_match(req: https_fn.CallableRequest):
    """
    Rollback a processed match, undoing all ELO changes and win/loss updates.
    Expects: { match_id: string }
    """
    match_id = req.data.get("match_id")
    if not match_id:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="match_id is required"
        )

    db = firestore.client()
    match_ref = db.collection("matches").document(match_id)
    match_doc = match_ref.get()

    if not match_doc.exists:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.NOT_FOUND,
            message=f"Match {match_id} not found"
        )

    match_data = match_doc.to_dict()

    # Verify caller is on the winning team
    caller_uid = req.auth.uid if req.auth else None
    if not caller_uid:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="Must be logged in to rollback a match"
        )

    win_team = match_data.get("win_team", {})
    if caller_uid not in win_team:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.PERMISSION_DENIED,
            message="Only players on the winning team can rollback this match"
        )

    if not match_data.get("processed", False):
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.FAILED_PRECONDITION,
            message="Match has not been processed yet"
        )

    leagueID = match_data["league_id"]
    league_k_factor = match_data.get("league_k_factor", 40)

    winTeamMap = match_data["win_team"]
    loseTeamMap = match_data["loss_team"]

    winPairs = [[pair[0], pair[1]["elo"]] for pair in winTeamMap.items()]
    losePairs = [[pair[0], pair[1]["elo"]] for pair in loseTeamMap.items()]

    winInput = [pair[1] for pair in winPairs]
    loseInput = [pair[1] for pair in losePairs]

    avgWin = sum(winInput) / len(winInput)
    avgLose = sum(loseInput) / len(loseInput)

    new_k_factor = calculateK(winInput, loseInput, baseK=league_k_factor)
    changeA, changeB = teamRatingChange(winInput, loseInput, new_k_factor)

    league_ref = db.collection("leagues").document(leagueID)

    @firestore.transactional
    def rollback_in_transaction(transaction):
        # Re-check match status inside transaction
        match_snapshot = match_ref.get(transaction=transaction)
        current_match_data = match_snapshot.to_dict()
        if not current_match_data.get("processed", False):
            return False  # Already rolled back

        league_doc = league_ref.get(transaction=transaction)
        if not league_doc.exists:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.NOT_FOUND,
                message=f"League {leagueID} not found"
            )

        league_data = league_doc.to_dict()
        if "elo_info" not in league_data:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.FAILED_PRECONDITION,
                message="League has no elo_info"
            )

        # Reverse winner changes
        for i in range(len(winPairs)):
            pid = winPairs[i][0]
            if pid in league_data["elo_info"]:
                league_data["elo_info"][pid]["elo"] -= changeA[i]
                league_data["elo_info"][pid]["wins"] = max(0, league_data["elo_info"][pid].get("wins", 1) - 1)
                if league_data["elo_info"][pid].get("opp_elo_sum") is not None:
                    league_data["elo_info"][pid]["opp_elo_sum"] -= avgLose

        # Reverse loser changes
        for i in range(len(losePairs)):
            pid = losePairs[i][0]
            if pid in league_data["elo_info"]:
                league_data["elo_info"][pid]["elo"] -= changeB[i]
                league_data["elo_info"][pid]["losses"] = max(0, league_data["elo_info"][pid].get("losses", 1) - 1)
                if league_data["elo_info"][pid].get("opp_elo_sum") is not None:
                    league_data["elo_info"][pid]["opp_elo_sum"] -= avgWin

        # Atomic update - both succeed or both fail
        transaction.set(league_ref, league_data)
        transaction.update(match_ref, {"processed": False, "rolled_back": True})
        return True

    transaction = db.transaction()
    success = rollback_in_transaction(transaction)

    if not success:
        return {"success": False, "message": f"Match {match_id} was already rolled back"}

    return {"success": True, "message": f"Match {match_id} has been rolled back"}


# @https_fn.on_call()
# def hash_league_password(req: https_fn.CallableRequest):
#     """
#     Hash a password for a league. Called when creating a league.
#     Expects: { league_id: string, password: string }
#     """
    # league_id = req.data.get("league_id")
    # password = req.data.get("password")

    # if not league_id or not password:
    #     raise https_fn.HttpsError(
    #         code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
    #         message="league_id and password are required"
    #     )

    # caller_uid = req.auth.uid if req.auth else None
    # if not caller_uid:
    #     raise https_fn.HttpsError(
    #         code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
    #         message="Must be logged in"
    #     )
    
    # db = firestore.client()
    # league_ref = db.collection("leagues").document(league_id)
    # league_doc = league_ref.get()

    # if not league_doc.exists:
    #     raise https_fn.HttpsError(
    #         code=https_fn.FunctionsErrorCode.NOT_FOUND,
    #         message="League not found"
    #     )
    
    # league_data = league_doc.to_dict()

    # # Only admin can set password
    # if league_data.get("admin_pid") != caller_uid:
    #     raise https_fn.HttpsError(
    #         code=https_fn.FunctionsErrorCode.PERMISSION_DENIED,
    #         message="Only league admin can set password"
    #     )

    # Hash the password
    # password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    # # Update league with hash and remove plaintext
    # league_ref.update({
    #     "password_hash": password_hash,
    #     "password": firestore.DELETE_FIELD
    # })

    # return {"password_hash": password_hash}


# @https_fn.on_call()
# def verify_league_password(req: https_fn.CallableRequest):
#     """
#     Verify a password for joining a league.
#     Expects: { league_id: string, password: string }
#     Returns: { valid: bool }
#     """
#     league_id = req.data.get("league_id")
#     password = req.data.get("password")

#     if not league_id or not password:
#         raise https_fn.HttpsError(
#             code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
#             message="league_id and password are required"
#         )

#     caller_uid = req.auth.uid if req.auth else None
#     if not caller_uid:
#         raise https_fn.HttpsError(
#             code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
#             message="Must be logged in"
#         )

#     db = firestore.client()
#     league_ref = db.collection("leagues").document(league_id)
#     league_doc = league_ref.get()

#     if not league_doc.exists:
#         raise https_fn.HttpsError(
#             code=https_fn.FunctionsErrorCode.NOT_FOUND,
#             message="League not found"
#         )

#     league_data = league_doc.to_dict()

    # Check for hashed password first (new system)
    # if "password_hash" in league_data:
    #     password_hash = league_data["password_hash"]
    #     valid = bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
    #     return {"valid": valid}

#     # Fall back to plaintext for unmigrated leagues
#     if "password" in league_data:
#         valid = (password == league_data["password"])
#         return {"valid": valid}

#     # No password set - public league
#     return {"valid": True}


# @https_fn.on_call()
# def migrate_league_passwords(req: https_fn.CallableRequest):
#     """
#     Admin function to migrate all plaintext passwords to hashed.
#     Only callable by specific admin UIDs.
#     """
#     caller_uid = req.auth.uid if req.auth else None
#     if not caller_uid:
#         raise https_fn.HttpsError(
#             code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
#             message="Must be logged in"
#         )

#     db = firestore.client()
#     leagues_ref = db.collection("leagues")
#     leagues = leagues_ref.stream()

#     migrated_count = 0
#     for league_doc in leagues:
#         league_data = league_doc.to_dict()

#         # Skip if already has hash or no plaintext password
#         if "password_hash" in league_data:
#             continue
#         if "password" not in league_data or not league_data["password"]:
#             continue

#         # Only migrate if caller is the admin of this league
#         if league_data.get("admin_pid") != caller_uid:
#             continue

#         # Hash and update
#         password = league_data["password"]
#         password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

#         league_doc.reference.update({
#             "password_hash": password_hash,
#             "password": firestore.DELETE_FIELD
#         })
#         migrated_count += 1

#     return {"success": True, "migrated": migrated_count}