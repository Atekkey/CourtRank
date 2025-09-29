import { 
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc,getDoc,
  query, where, orderBy, onSnapshot,setDoc,
  arrayUnion, arrayRemove, deleteField,
  serverTimestamp , getDocFromCache, getDocsFromCache, getDocsFromServer, getDocFromServer,
  limit,
  endBefore,
  startAfter,
  Query
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  onAuthStateChanged,
  GoogleAuthProvider, signInWithCredential,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  getRedirectResult
} from 'firebase/auth';
import { db, auth } from './firebaseConfig';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { makeRedirectUri } from 'expo-auth-session';
import { use, useRef, useState } from 'react';



// Sign in with Google

// *NOTE: These env variables will not process on web, only through expo
const { WEB_CLIENT_ID, IOS_CLIENT_ID, ANDROID_CLIENT_ID } = Constants.expoConfig.extra;

WebBrowser.maybeCompleteAuthSession();

const redirectUri = makeRedirectUri({
  scheme: 'courtrank',
  path: 'redirect'
});

export function useGoogleAuth() {
  
  console.log('[useGoogleAuth] Hook initialized');
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    redirectUri: redirectUri,
    scopes: ['profile', 'email'],
  });

  async function signInWithGoogle() {
    if (!promptAsync) throw new Error('Google Auth request not ready');

    const result = await promptAsync();

    if (result?.type !== 'success') {
      throw new Error('Google sign-in was cancelled or failed');
    }

    const { id_token } = result.params;

    let user = null;
    
    try {
      const credential = GoogleAuthProvider.credential(id_token);
      const userCredential = await signInWithCredential(auth, credential);
      user = userCredential.user;

      try {
        await createPlayerDoc(user);
      } catch (error) {
        console.log('Error creating player document:', error);
        // If player doc creation fails, delete the authenticated user to avoid orphaned auth accounts
        if (user) {
          auth
            .deleteUser(user.uid)
            .then(() => {
              console.log('Successfully deleted user');
            })
            .catch((error) => {
              console.log('Error deleting user:', error);
            });
        }
      }
  } catch (error) {
      console.log('Error during Firebase sign-in with Google credential:', error);
      throw error;
  }
    return user;
    
  }

  return { request, response, signInWithGoogle };
}

async function createPlayerDoc(user) {
  // console.log("[firebaseService.js]: Creating player doc for user ", user);
  const playerRef = doc(db, "players", user.uid);
  const docSnap = await getDoc(playerRef);
  

  if (!docSnap.exists()) {
    const displayName = user.displayName || '';
    const [firstName, ...lastNameParts] = displayName.split(' ');
    const lastName = lastNameParts.join(' ');

    await setDoc(playerRef, {
      created_at: new Date(),
      email: user.email || '',
      first_name: firstName || '',
      last_name: lastName || '',
      league_info: [],
      photo_URL: user.photoURL || '',
    });

 

    console.log('New player document created for:', user.email);
  } else {
    console.log('Player document already exists for:', user.email);
  }
}

// Auth Functions
export const registerPlayer = async (email, password, userData) => {
  let user = null;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    user = userCredential.user;

    // Add player profile to Firestore
    // uses player.uid as the document ID
    try {
      await setDoc(doc(db, 'players', user.uid), {
        created_at: new Date(),
        email: user.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        league_info: [],
        photo_URL: "",
        // Note, player_id not stored bc it is docID
      });
    } catch (error) {
      console.log('Error creating player document:', error);
        // Remove user from firestore database upon doc creation error
        if (user) {
          auth
            .deleteUser(user.uid)
            .then(() => {
              console.log('Successfully deleted user');
            })
            .catch((error) => {
              console.log('Error deleting user:', error);
            });
        }
    }


    return user;
  } catch (error) {

    console.log('Error during registration:', error);
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};

// Notification Functions
export const getUserNotifications = async (user_id) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('players', 'array-contains', user_id),
    );
    const notifications = [];
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      notifications.push({id: doc.id, ...doc.data()});
    });
    return notifications;
  } catch (error) {
    throw error;
  }
}

export const createNotification = async (notificationInfo) => {
  try {
    const docRef = await addDoc(collection(db, 'notifications'), notificationInfo);
    return { id: docRef.id, ...notificationInfo };
  } catch (error) {
    throw error;
  }
}

// League Functions
export const createLeague = async (data={}) => {

  try {
    const customId = doc(collection(db, 'leagues')).id; // gen uniq id
    await setDoc(doc(db, 'leagues', customId), {
      admin_pid: data.admin_pid || '', // Needs init
      league_k_factor: data.league_k_factor || 40,
      is_public: data.is_public,
      league_end_date: data.league_end_date || null,
      league_name: data.league_name || 'New League',
      starting_elo: 800,
      created_at: new Date(),

      league_id: customId,
      location: data.location || '',
      description: data.description || '',

      elo_info: {},
      players: [],
      password: data.password,
    });
    // Add admin to players and elo_info
    await joinLeague(customId, data.admin_pid);

    return customId;
  } catch (error) {
    throw error;
  }

};

export const getLeagues = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'leagues'));
    const leagues = [];
    querySnapshot.forEach((doc) => {
      leagues.push({ league_id: doc.id, ...doc.data() });
    });
    return leagues;
  } catch (error) {
    throw error;
  }
};

export const joinLeague = async (league_id, user_id) => {
  try {
    console.log('Joining league:', league_id, 'for user:', user_id);

    const leagueRef = doc(db, 'leagues', league_id);
    const leagueDoc = await getDoc(leagueRef);
    if (!leagueDoc.exists()) { throw new Error('League not found'); }
    const leagueData = leagueDoc.data();

    const playerRef = doc(db, 'players', user_id);
    const playerDoc = await getDoc(playerRef);
    if (!playerDoc.exists()) { throw new Error('User not found'); }
    const playerData = playerDoc.data();

    if (leagueData.players && leagueData.players.includes(user_id)) {
      throw new Error('You are already a member of this league');
    }

    // Add user to the league's players array
    await setDoc(leagueRef, {
      players: arrayUnion(user_id),
      elo_info: {
        [user_id]: {
          elo: leagueData.starting_elo || 800,
          wins: 0,
          losses: 0,
          ties: 0,
          first_name: playerData.first_name || '',
          last_name: playerData.last_name || '',
          score: 0,
          opp_elo_sum: 0
        }
      }
    }, { merge: true });
    
    return { success: true, message: 'Successfully joined the league' };
  } catch (error) {
    throw error;
  }
};

export const leaveLeague = async (league_id, user_id) => {
  console.log('Leaving league:', league_id, 'for user:', user_id);
  try {
    const leagueRef = doc(db, 'leagues', league_id);
    const leagueDoc = await getDoc(leagueRef);
    if (!leagueDoc.exists()) {
      throw new Error('League not found');
    }

    const leagueData = leagueDoc.data();
    if (!leagueData.players || !leagueData.players.includes(user_id)) {
      throw new Error('You are not a member of this league');
    }

    // Remove user from the league's players array
    await setDoc(leagueRef, {
      players: arrayRemove(user_id),
      elo_info: {
        [user_id]: deleteField()
      }
    }, { merge: true });

    return { success: true, message: 'Successfully left the league' };
  } catch (error) {
    throw error;
  }
};

export const getUserLeagues = async (user_id) => {
  try {
    const q = query(
      collection(db, 'leagues'),
      where('players', 'array-contains', user_id),
    );
    const querySnapshot = await getDocs(q);
    const leagues = [];
    querySnapshot.forEach((doc) => {
      leagues.push({ league_id: doc.id, ...doc.data() });
    });
    return leagues;
  } catch (error) {
    throw error;
  }
};

// User Functions for index.tsx
export const getPlayerInfo = async (user_id) => {
  try {
    const userRef = doc(db, 'players', user_id);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    return { user_id: userDoc.id, ...userDoc.data() };
  } catch (error) {
    throw error;
  }
};

// Match Functions
export const createMatch = async (matchData) => {
  try {
    const docRef = await addDoc(collection(db, 'matches'), {
      ...matchData,
    });
    return docRef.id;
  } catch (error) {
    return null;
  }
};

export const getAllMatches = async () => {
  try {
    const q = query(
      collection(db, 'matches'),
      orderBy('timestamp', 'desc')
    );
    const matches = [];

    // Check for cached matches first
    console.log("Checking cache for matches...");
    let querySnapshot = await getDocsFromCache(q);
    let updateDocs = [];

    // Query is empty, no cached data exists
    if (querySnapshot.empty) {
      console.log("No cached matches exist, reading from server");
      querySnapshot = await getDocsFromServer(q);
    } else {
      console.log("Cached matches found, checking for updates from server...");
      
      // Latest local timestamp
      const localMaxTimestamp = querySnapshot.docs[0].data().timestamp;

      // Identify local match docs at timestamp
      const latestLocalDocs = querySnapshot.docs
        .filter(doc => doc.data().timestamp.isEqual(localMaxTimestamp))
        .map(doc => doc.id);

      // Cached data exist, but we want to check for new data
      const updateQ = query(
        collection(db, 'matches'),
        where("timestamp", ">=", localMaxTimestamp), 
        orderBy('timestamp', 'desc')
      );

      const updateSnapshot = await getDocsFromServer(updateQ);

      // Remove latestLocalDocs from updateSnapshot
      updateDocs = updateSnapshot.docs.filter(
        doc => !latestLocalDocs.includes(doc.id)
      );

      if (!updateDocs.length) {
        console.log("No updates found");
      }

    }

    

    console.log("Main query size: ", querySnapshot.docs.length);
    console.log("Update query size : ", updateDocs.length);


    // Add updated data to matches array
    if (updateDocs.length) {
      console.log("Updates found, adding updates to matches...");

      updateDocs.forEach((doc) => {
        matches.push({id: doc.id, ...doc.data()});
      });
    }


    // Add cached data to matches array
    querySnapshot.forEach((doc) => {
      matches.push({id: doc.id, ...doc.data()});
    });



    console.log("Matches size: ", matches.length);

    return matches;
  } catch (error) {
    throw error;
  }
}

// useMatches hook
export function useMatches() {
  // stateHooks:
  const [matchesWindow, setMatchesWindow] = useState([]);

  // page index (to get window)
  const page = useRef(0);
  const pageSize = useRef(20);

  // Map<leagueID, matches[]> allMatches
  const allMatches = useRef(new Map());

  // currLeague
  const currLeague = useRef(null);

  // !! Maybe have boolean value telling if reached end of matches for currLeague (so no more next page)
  const endOfMatches = useRef(false);
  const startOfMatches = useRef(true);

  // funcs:
  //  fetchMatches (Ids[]) (fetches matches given league array)
  
  async function startUseMatches(leagueIDs) {
    // params: user league_ids
    // This essesntially initializes the hook with some data
    // Will populate allMatches map with a key for each leagueID

    // need to clear all vars using useRef first to eliminate stale data
    allMatches.current = new Map();
    page.current = 0;


    for (const leagueID of leagueIDs) {
      allMatches.set(leagueID, []);
    }

  }

  async function setLeague(leagueID) {
    // sets currLeague, fetches matches if not already fetched
    try {
      if (!allMatches.current.has(leagueID)) {
        throw new Error('League not found in useMatches hook');
      }

      currLeague.current = leagueID;

      if (allMatches.current.get(leagueID).length === 0) {
        // no matches fetched yet, fetch now
        allMatches.current.set(leagueID, await fetchLeagueMatches(leagueID));
      }

      const matches = allMatches.current.get(leagueID);

      // set page to 0
      page.current = 0;


      // set matchesWindow to first page of matches
      // uses current page and page size to calculate window 
      if (matches.length <= pageSize.current) {
        // if less than one page of matches, set endOfMatches to true
        endOfMatches.current = true;
        setMatchesWindow(matches.slice(0, matches.length));
      } else {
        setMatchesWindow(matches.slice(0, pageSize.current));
      }
      // setMatchesWindow(allMatches.current.get(leagueID).slice(page.current * pageSize.current, (page.current + 1) * pageSize.current));
      

    } catch (error) {
      throw error;

    }


  }

  // fetch first 40 matches for a single leagueID, checking cache first
  async function fetchLeagueMatches(leagueID) {
    try {
      const cacheQ = query(
        collection(db, 'matches'),
        where('league_id', '==', leagueID),
        orderBy('timestamp', 'desc'),
        orderBy('league_id', 'desc'), // ordering by league_id also to ensure deterministic ordering in case of equal timestamps
      );
      const matches = [];

      // Check for cached matches first
      console.log("Checking cache for matches...");
      const cacheSnapshot = await getDocsFromCache(cacheQ);

      // Query is empty, no cached data exists
      if (cacheSnapshot.empty) {
        console.log("No cached matches exist, reading 2 pages from server");
        const serverQ = query(
          collection(db, 'matches'),
          where('league_id', '==', leagueID),
          orderBy('timestamp', 'desc'),
          orderBy('league_id', 'desc'),
          limit(pageSize.current * 2)
        );
        const serverSnapshot = await getDocsFromServer(serverQ);

        serverSnapshot.forEach((doc) => {
          matches.push({id: doc.id, ...doc.data()});
        });

        return matches;

      } 


      // Check for existing matches newer than latest cached match
      const updateQuery = query(
        collection(db, 'matches'),
        where('league_id', '==', leagueID),
        orderBy('timestamp', 'desc'),
        orderBy('league_id', 'desc'),
        endBefore(cacheSnapshot.docs[0]),
        limit(pageSize.current * 2) // also use limit in case of large gap between cache and server to prevent excessive reads
      );

      const updateSnapshot = await getDocsFromServer(updateQuery);

      if (!updateSnapshot.empty) {
        // updates found, add to matches
        updateSnapshot.forEach((doc) => {
          matches.push({id: doc.id, ...doc.data()});
        });

        if (updateSnapshot.docs.length >= pageSize * 2) {
          // assume stale cache, just return updates
          return matches;
        } 
      }


          
      // updates connect to cache, include cached data
      cacheSnapshot.forEach((doc) => {
        matches.push({id: doc.id, ...doc.data()});
      });



      // if < 2 pages of matches exist, check for older matches
      // just an edge case if matches were cached, then some older matches were deleted from cache 
      if (matches.length < pageSize * 2) {
        const gapQuery = query(
          collection(db, 'matches'),
          where('league_id', '==', leagueID),
          orderBy('timestamp', 'desc'),
          orderBy('league_id', 'desc'),
          startAfter(cacheSnapshot.docs[cacheSnapshot.docs.length - 1]),
          limit((pageSize * 2) - matches.length)
        );

        const gapSnapshot = await getDocsFromServer(gapQuery);
        if (!gapSnapshot.empty) {
          // gap exists, add gap to matches to total 2 pages worth of matches
          gapSnapshot.forEach((doc) => {
            matches.push({id: doc.id, ...doc.data()});
          });

        }
      }

      return matches;
            

  } catch (error) {
      throw error;
  }
}

  

 
  // nextPage()
  async function nextPage() {
    try {
      // needs to query next next page from server using start after functionality (if matches array is >= 40 and !endOfMatches)
      // if matches exist after current window
        // setCurrPage++
        // if no matches exist after new window, set endOfMatches(true)
        // update to new window (mindful if < 20 exist in window)
      
      const matches = allMatches.current.get(currLeague.current);

      const windowEnd = (page.current + 1) * pageSize.current;

      if (!endOfMatches.current) {
        
        // first try to slide window since new page should already be loaded (always one extra ready)
        if (matches.length > windowEnd) {
          // matches exist after current window, safe to shift window
          page.current = page.current + 1;

          // set matches window, using Math.min in case of < pageSize new matches
          setMatchesWindow(matches.slice(page.current * pageSize.current, 
            Math.min((page.current + 1) * pageSize.current), matches.length));

          if (page.current > 0) {
            startOfMatches.current = false;
          }
          

        }


        // then query for next page of matches
        const q = query(
          collection(db, 'matches'),
          where('league_id', '==', currLeague.current),
          orderBy('timestamp', 'desc'),
          orderBy('league_id', 'desc'), // ordering by league_id also to ensure deterministic ordering in case of equal timestamps
          startAfter(matches[matches.length - 1].timestamp, matches[matches.length - 1].league_id),
          limit(pageSize.current)
        );


        const querySnapshot = await getDocsFromServer(q);

        // if snaphot empty, this is end of matches
        if (querySnapshot.empty) {
          endOfMatches.current = true;
        }


        // update allMatches map with querySnapshot
        querySnapshot.forEach((doc) => {
          matches.push({id: doc.id, ...doc.data()});
        });
        
        allMatches.current.set(currLeague.current, matches);
      } else {
        console.log("End of matches reached, cannot go to next page");
      }


    } catch (error) {
      throw error;
    }
  }
  // prevPage()

  async function prevPage() {
    try {
      if (startOfMatches.current) {
        console.log("Start of matches reached, cannot go to previous page");
        return;
      }

      // decrement page number
      page.current = page.current - 1;

      // set new window based on page number
      setMatchesWindow(allMatches.get(currLeague.current).slice(page.current * pageSize.current, (page.current + 1) * pageSize.current));

      // check if start of pages
      if (page.current < 1) {
        startOfMatches.current = true;
      }

    } catch (error) {
      throw error;
    }
  }

}