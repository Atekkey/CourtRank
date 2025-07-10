// services/firebaseService.js
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
import { db, auth } from '../firebaseConfig';

// Auth Functions
export const registerUser = async (email, password, userData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Add user profile to Firestore
    await addDoc(collection(db, 'users'), {
      uid: user.uid,
      email: user.email,
      ...userData,
      createdAt: new Date()
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
    const docRef = await addDoc(collection(db, 'leagues'), {
      ...leagueData,
      createdAt: new Date(),
      players: [],
      matches: []
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
      leagues.push({ id: doc.id, ...doc.data() });
    });
    return leagues;
  } catch (error) {
    throw error;
  }
};

export const joinLeague = async (leagueId, userId) => {
  try {
    const leagueRef = doc(db, 'leagues', leagueId);
    // You'll need to implement array union logic here
    await updateDoc(leagueRef, {
      players: [...players, userId] // This needs proper array union
    });
  } catch (error) {
    throw error;
  }
};

export const getUserLeagues = async (userId) => {
  try {
    const q = query(
      collection(db, 'leagues'),
      where('players', 'array-contains', userId)
    );
    const querySnapshot = await getDocs(q);
    const leagues = [];
    querySnapshot.forEach((doc) => {
      leagues.push({ id: doc.id, ...doc.data() });
    });
    return leagues;
  } catch (error) {
    throw error;
  }
};

// Match Functions
export const createMatch = async (matchData) => {
  try {
    const docRef = await addDoc(collection(db, 'matches'), {
      ...matchData,
      createdAt: new Date(),
      status: 'pending'
    });
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const updateMatchResult = async (matchId, result) => {
  try {
    const matchRef = doc(db, 'matches', matchId);
    await updateDoc(matchRef, {
      result: result,
      status: 'completed',
      completedAt: new Date()
    });
  } catch (error) {
    throw error;
  }
};

// Real-time listeners
export const subscribeToLeagues = (callback) => {
  const unsubscribe = onSnapshot(collection(db, 'leagues'), (snapshot) => {
    const leagues = [];
    snapshot.forEach((doc) => {
      leagues.push({ id: doc.id, ...doc.data() });
    });
    callback(leagues);
  });
  return unsubscribe;
};

export const subscribeToUserLeagues = (userId, callback) => {
  const q = query(
    collection(db, 'leagues'),
    where('players', 'array-contains', userId)
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const leagues = [];
    snapshot.forEach((doc) => {
      leagues.push({ id: doc.id, ...doc.data() });
    });
    callback(leagues);
  });
  return unsubscribe;
};