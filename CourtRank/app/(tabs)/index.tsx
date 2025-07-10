// import { Text, View } from "react-native";

// export default function Index() {
//   return (
//     <View
//       style={{
//         flex: 1,
//         justifyContent: "center",
//         alignItems: "center",
//       }}
//     >
//       <Text>Edit app/index.tsx to edit this screen.</Text>
//     </View>
//   );
// }

// app/index.tsx
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Import your config (adjust path if needed)
import firebaseConfig from '../../firebaseConfig';

export default function Index() {
  useEffect(() => {
    console.log('Testing Firebase...');
    
    try {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      const db = getFirestore(app);
      const auth = getAuth(app);
      
      console.log('✅ Firebase initialized successfully!');
      console.log('Project ID:', app.options.projectId);
    } catch (error) {
      console.error('❌ Firebase error:', error.message);
    }
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Welcome to CourtRank!</Text>
      <Text>Check the console for Firebase status</Text>
    </View>
  );
}