# AJT: I ran
# $ npm install -g firebase-tools
# $ firebase init
# TODO: $ firebase deploy

# Start emulator $ firebase emulators:start --only functions,firestore

from firebase_functions import https_fn, firestore_fn
from firebase_functions.options import set_global_options
from firebase_admin import initialize_app
from cloudevents.http import CloudEvent

set_global_options(max_instances=10)

initialize_app()

@firestore_fn.on_document_created(document="matches/{matchId}")
def on_match_created(event: firestore_fn.Event[firestore_fn.DocumentSnapshot | None]) -> None:
    # On New match

    if not event.data:
        return
    match_data, doc_id = event.data.to_dict(), event.data.id
    if match_data["processed"] == True:
        return
    
    league_k_factor = 40
    try:
        league_k_factor = match_data["league_k_factor"]
    except KeyError:
        pass
    leagueID = match_data["league_id"]

    winTeamMap = match_data["win_team"] # This holds PIDS -> {elo:#, ...}
    loseTeamMap = match_data["loss_team"] # This holds PIDS -> {elo:#, ...}
    
