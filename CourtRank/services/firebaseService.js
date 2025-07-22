
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { db, auth } from './firebaseConfig';

// Auth Functions
export const registerPlayer = async (email, password, userData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Add player profile to Firestore
    // uses player.uid as the document ID
    await setDoc(doc(db, 'players', user.uid), {
      created_at: new Date(),
      email: user.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      elo_array: [],
      // Note, player_id not stored bc it is docID
    });

    return user;
  } catch (error) {
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

// League Functions
export const createLeague = async (leagueData) => {
  try {
    const docRef = await setDoc(doc(db, 'leagues', leagueData.id), {
      ...leagueData, // puts all league data in here, not nested (like python **)
      // admin_pid, is_public, league_end_date, league_name, league_k_factor
      starting_elo: 800, // Default starting ELO rating
      created_at: new Date(),
      elo_array: [],
      matches: [],
      whitelist_pids: [],
      players: [], // Todo, init admin into everything
    });
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const getLeagues = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'leagues'));
    const leagues = [];
    querySnapshot.forEach((doc) => {
      leagues.push({ league_id: doc.id, ...doc.data() }); // TODO: if needed, only take important brief info
    });
    return leagues;
  } catch (error) {
    throw error;
  }
};

export const joinLeague = async (league_id, user_id) => {
  try {
    const leagueRef = doc(db, 'leagues', league_id);
    const leagueDoc = await getDoc(leagueRef);
    if (!leagueDoc.exists()) { throw new Error('League not found'); }
    const leagueData = leagueDoc.data();
    
    if (!leagueData.is_public) {
      // League is private... Check if user is in whitelist. Confirms not empty first
      if (!leagueData.whitelist_pids || !leagueData.whitelist_pids.includes(user_id)) {
        throw new Error('An invite is required to join this league');
      }
    }

    if (leagueData.players && leagueData.players.includes(user_id)) {
      throw new Error('You are already a member of this league');
    }

    // Add user to the league's players array
    await updateDoc(leagueRef, {
      players: arrayUnion(user_id),
      elo_array: arrayUnion({ // USER LEAGUE DATA. TODO: Should this be a separate collection??
        user_id: user_id,
        elo: leagueData.starting_elo || 800, // takes 800 if starting elo DNE
        wins: 0,
        losses: 0,
        ties: 0
      })
    });
    
    return { success: true, message: 'Successfully joined the league' };
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


/////////////////// All Below Might be unnecessary


// Match Functions

export const createMatch = async (matchData) => {
  try {
    const docRef = await addDoc(collection(db, 'matches'), {
      league_id: matchData.league_id, // League ID
      league_k_factor: matchData.league_k_factor, // League K-factor
      winning_players: matchData.winning_players, // Array of player IDs
      losing_players: matchData.losing_players, // Array of player IDs
      createdAt: new Date(),
      // status: 'init'
    });
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

// export const updateMatchResult = async (matchId, result) => {
//   try {
//     const matchRef = doc(db, 'matches', matchId);
//     await updateDoc(matchRef, {
//       result: result,
//       status: 'completed',
//       completedAt: new Date()
//     });
//   } catch (error) {
//     throw error;
//   }
// };

// Real-time listeners

export const subscribeToLeagues = (callback) => {
  const unsubscribe = onSnapshot(collection(db, 'leagues'), (snapshot) => {
    const leagues = [];
    snapshot.forEach((doc) => {
      leagues.push({ league_id: doc.id, ...doc.data() });
    });
    callback(leagues);
  });
  return unsubscribe;
};

export const subscribeToUserLeagues = (user_id, callback) => {
  const q = query(
    collection(db, 'leagues'),
    where('players', 'array-contains', user_id)
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const leagues = [];
    snapshot.forEach((doc) => {
      leagues.push({ league_id: doc.id, ...doc.data() });
    });
    callback(leagues);
  });
  return unsubscribe;
};