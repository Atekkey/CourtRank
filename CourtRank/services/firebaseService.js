// import * as Google from 'expo-auth-session/providers/google';
// import * as WebBrowser from 'expo-web-browser';

import { 
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc,getDoc,
  query, where, orderBy, onSnapshot,setDoc,
  arrayUnion, arrayRemove, deleteField,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  onAuthStateChanged,
  GoogleAuthProvider, 
  signInWithCredential,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import { db, auth } from './firebaseConfig';

// WebBrowser.maybeCompleteAuthSession();
// export const signInWithGoogle = async () => {
//   try {
//     const request = new Google.GoogleAuthRequest({
//       clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID, 
//       scopes: ['profile', 'email'],
//       responseType: Google.ResponseType.IdToken,
//     });

//     const result = await request.promptAsync();
    
//     if (result.type === 'success') {
//       const { id_token } = result.params;
      
//       // Create Firebase credential
//       const credential = GoogleAuthProvider.credential(id_token);
      
//       const userCredential = await signInWithCredential(auth, credential);
//       const user = userCredential.user;
      
//       await createOrUpdateUserProfile(user, {
//         first_name: user.displayName?.split(' ')[0] || '',
//         last_name: user.displayName?.split(' ').slice(1).join(' ') || '',
//         email: user.email || '',
//         photo_url: user.photoURL || '',
//         provider: 'google'
//       });
      
//       return user;
//     } else {
//       throw new Error('Google sign-in was cancelled');
//     }
//   } catch (error) {
//     console.error('Google Sign-In Error:', error);
//     throw error;
//   }
// };


// Auth Functions
export const registerPlayer = async (email, password, userData) => {
  let user = null;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    user = userCredential.user;

    // Add player profile to Firestore
    // uses player.uid as the document ID
    await setDoc(doc(db, 'players', user.uid), {
      created_at: new Date(),
      email: user.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      league_info: [],
      // Note, player_id not stored bc it is docID
    });

    return user;
  } catch (error) {
      // Remove user from firestore database upon doc creation error
      if (user) {
        try {
          await user.delete();
          console.warn('Auth user deleted due to Firestore failure');
        } catch (deleteError) {
          console.error('Failed to delete user after Firestore failure:', deleteError);
        }
      }
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

// Data should have (Bool isPublic, Str admin_pid, Str league_name, Date league_end_date, Number league_k_factor)
export const createLeague = async (data={}) => {

  let whitelist_pids_ = [];
  if (data.admin_pid && data.admin_pid.trim() !== '') {
    whitelist_pids_ = data.is_public ? [data.admin_pid] : [];
  }

  try {
    const customId = doc(collection(db, 'leagues')).id; // gen uniq id
    await setDoc(doc(db, 'leagues', customId), {
      admin_pid: data.admin_pid || '', // Needs init
      league_k_factor: data.league_k_factor || 40,
      is_public: data.is_public || true,
      league_end_date: data.league_end_date || null,
      league_name: data.league_name || 'New League',
      starting_elo: 800,
      created_at: new Date(),
      matches: [],

      league_id: customId,
      location: data.location || '',
      description: data.description || '',

      elo_info: {},
      whitelist_pids: whitelist_pids_,
      players: [],
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
    await setDoc(leagueRef, {
      players: arrayUnion(user_id),
      elo_info: {
        [user_id]: {
          elo: leagueData.starting_elo || 800,
          wins: 0,
          losses: 0,
          ties: 0,
          first_name: playerData.first_name || '',
          last_name: playerData.last_name || ''
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