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

@firestore_fn.on_document_created(document="matches/{matchId}")
def on_match_created(event: firestore_fn.Event[firestore_fn.DocumentSnapshot | None]) -> None:

    if not event.data:
        return
    match_data = event.data.to_dict()
    if match_data.get("processed", False): # if not found gives false
        return
    
    leagueID = match_data["league_id"]
    league_k_factor = match_data.get("league_k_factor", 40)
    
    winTeamMap = match_data["win_team"]  # This holds PIDS -> {elo:#, ...}
    loseTeamMap = match_data["loss_team"]  # This holds PIDS -> {elo:#, ...}
    
    winPairs = [[pair[0], pair[1]["elo"]] for pair in winTeamMap.items()]  # [[pid, elo], [pid,elo]]
    losePairs = [[pair[0], pair[1]["elo"]] for pair in loseTeamMap.items()]  # [[pid, elo], [pid,elo]]
    
    winInput = [pair[1] for pair in winPairs]
    loseInput = [pair[1] for pair in losePairs]
    
    avgWin, avgLose = sum(winInput) / len(winInput), sum(loseInput) / len(loseInput)

    new_k_factor = calculateK(winInput, loseInput, baseK=league_k_factor)

    winOutput, loseOutput = teamUpdateRating(winInput, loseInput, new_k_factor)
    
    db = firestore.client()
    doc_ref = db.collection("leagues").document(leagueID)
    league_doc = doc_ref.get()
    
    if not league_doc.exists:
        print(f"League document {leagueID} does not exist")
        return
    
    league_data = league_doc.to_dict()
    
    if "elo_info" not in league_data:
        league_data["elo_info"] = {}
    
    for i in range(len(winPairs)):
        pid = winPairs[i][0]
        newElo = int(winOutput[i])
        
        if pid not in league_data["elo_info"]:
            print(f"{pid} WINNER NOT IN LEAGUE")
        
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
        
        league_data["elo_info"][pid]["elo"] = newElo
        league_data["elo_info"][pid]["losses"] += 1
        
        if league_data["elo_info"][pid].get("opp_elo_sum") is None:
            league_data["elo_info"][pid]["opp_elo_sum"] = avgWin
        else:
            league_data["elo_info"][pid]["opp_elo_sum"] += avgWin
    
    
    event.data.reference.update({"processed": True})
    
    doc_ref.set(league_data)