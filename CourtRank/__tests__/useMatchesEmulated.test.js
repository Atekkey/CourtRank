

// // test league id: luQCFJQt8juMt99EM5T7

// // jest.mock('expo-auth-session', () => {
// //   const actual = jest.requireActual('expo-auth-session');
// //   return {
// //     ...actual,
// //     makeRedirectUri: jest.fn(() => 'test://redirect'),
// //     WebBrowser: {
// //       maybeCompleteAuthSession: jest.fn(),
// //     },
// //   };
// // });

// // jest.mock('expo-constants', () => ({
// //   expoConfig: {
// //     extra: {
// //       WEB_CLIENT_ID: 'TEST_WEB_CLIENT_ID',
// //       IOS_CLIENT_ID: 'TEST_IOS_CLIENT_ID',
// //       ANDROID_CLIENT_ID: 'TEST_ANDROID_CLIENT_ID',
// //     },
// //   },
// // }));

// import { renderHook, waitFor, act } from '@testing-library/react';
// import {useMatches} from '../hooks/useMatches';
// // import { createMatch, getAllMatches } from '@/services/firebaseService';
// import {db} from '@/services/firebaseTestConfig';
// import { collection, query, deleteDoc, getDocs, doc, getDoc, setDoc} from 'firebase/firestore';
const { describe, test, expect, beforeEach, beforeAll, jest } = require('@jest/globals');

// // Generate fake matches for testing
// export function generateFakeMatches(count = 50, startTime = 1000, leagueId = 'luQCFJQt8juMt99EM5T7') {
//   const matches = [];
//   for (let i = 0; i < count; i++) {
//     matches.push({
//       id: `match_${i}`,
//       data: () => ({
//         leagueId,
//         name: `Match ${i}`,
//         timestamp: startTime + (i * 10), // simple increment for ordering
//       }),
//     });
//   }
//   return matches;
// }



// // creates fake matches in a collection
// // async function createFakeMatches(count = 50, startTime = 1000, leagueId = 'leagueA') {
// //   // create fake matches
// //   const promises = [];
// //   for (let i = 0; i < count; i++) {
// //     promises.push(createMatch({
// //       leagueId,
// //       name: `Match ${i}`,
// //       timestamp: startTime + (i * 10),
// //     }));
// //   }
  
// //   try {
// //     const results = await Promise.all(promises);
// //     console.log(`✅ Created ${count} fake matches`, results);
// //   } catch (error) {
// //     console.error('❌ Error creating fake matches:', error);
// //   }
// // }

// export function assertUsingFirestoreEmulator(db) {
//   const settings = db._settings;

//   if (!settings || !settings.host || !settings.host.includes('127.0.0.1:8080')) {
//     throw new Error(
//       `❌ Firestore is NOT using emulator. Host = ${settings?.host}`
//     );
//   }

//   console.log('✅ Firestore is using emulator:', settings.host);
// }

// // Remove all matches from the collection
// async function removeAllMatches() {
//   const matchesCollection = collection(db, "matches");
//   const q = query(matchesCollection);
//   const snapshot = await getDocs(q);
//   // const batch = db.batch();

//   let deleteOps = [];
//   snapshot.forEach(doc => {
//     deleteOps.push(deleteDoc(doc.ref));
//   });

//   await Promise.all(deleteOps)
// }

describe('Not a test',() => {
  test('placeholder test', () => {
    expect(true).toBe(true);
  });
});


// describe('fetchLeagueMatches Tests', () => {

//     beforeAll(() => {
//         assertUsingFirestoreEmulator(db);
//     });


//     // beforeEach(async () => { 
//     //   await removeAllMatches();
//     //   await createFakeMatches();
//     // });

    
// test("can read from Firestore emulator", async () => {
//   assertUsingFirestoreEmulator(db);
//   const snap = await getDocs(collection(db, "matches"));
//   expect(snap).toBeDefined();
// });

//   test('simple test', () => {
//     expect(1 + 1).toBe(2);
//   });

// //   test("definitely using emulator", async () => {
// //   const ref = doc(db, "__emulator_proof__/one");

// //   await setDoc(ref, { ok: true });

// //   const snap = await getDoc(ref);

// //   expect(snap.exists()).toBe(true);
// //   expect(snap.data().ok).toBe(true);
// // }, 10000);

//   // test("getAllMatchesTest" , async () => {
//   //     const myMatches = await getAllMatches();

//   //     console.log("all matches:", myMatches);
//   // }, 100000);

//   // test('simple test 2', async () => {
//   //      const { result } = renderHook(() => useMatches());
//   //      await createFakeMatches(5, 1000, 'leagueA');

//   //      expect(1 + 1).toBe(2);
//   // }, 10000);


// });

// /*

// describe('fetchLeagueMatches Tests', () => {
//   // clear mock values before each test
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   test("CASE 0: Cache has 40 matches, no server matches exist", async () => {
//     const fakeCacheMatches = generateFakeMatches(40, 1000, 'leagueA');
//     const fakeServerMatches = [];

//     const mockFirestore = createMockFirestore({
//       cacheMatches: fakeCacheMatches,
//       serverMatches: fakeServerMatches,
//     });

//     // start fresh hook
//     const { result } = renderHook(() => useMatches(mockFirestore));
//     result.current.startUseMatches(['leagueA']);

//     let matches = [];

//     // call fetchLeagueMatches
//     await act(async () => {
//       matches = await result.current.fetchLeagueMatches('leagueA');
//     });

//     await waitFor(() => {
//       expect(matches.length).toBe(40);
//       expect(matches).toEqual(fakeCacheMatches); // Directly compare the pure array
//     });
//   });

//   test("CASE 1: Cache has 40 matches, server has 20 newer matches", async () => {
//     const fakeCacheMatches = generateFakeMatches(40, 1000, 'leagueA');
//     const fakeServerMatches = generateFakeMatches(20, 1400, 'leagueA');

//     const mockFirestore = createMockFirestore({
//       cacheMatches: fakeCacheMatches,
//       serverMatches: fakeServerMatches,
//     });

//     // start fresh hook
//     const { result } = renderHook(() => useMatches(mockFirestore));
//     result.current.startUseMatches(['leagueA']);

//     let matches = [];

//     // call fetchLeagueMatches
//     await act(async () => {
//       matches = await result.current.fetchLeagueMatches('leagueA');
//     });

//     const correctMatches = [...fakeServerMatches, ...fakeCacheMatches];
//     console.log("fetched Matches:", matches);

//     await waitFor(() => {
//       expect(matches.length).toBe(60);
//       expect(matches).toEqual(correctMatches); // Directly compare the pure array
//     });
//   });

//   test("CASE 2: Cache has 40 matches, 40+ newer server matches exist", async () => {
//     const fakeCacheMatches = generateFakeMatches(40, 1000, 'leagueA');
//     const fakeServerMatches = generateFakeMatches(40, 1400, 'leagueA');

//     const mockFirestore = createMockFirestore({
//       cacheMatches: fakeCacheMatches,
//       serverMatches: fakeServerMatches,
//     });

//     // start fresh hook
//     const { result } = renderHook(() => useMatches(mockFirestore));
//     result.current.startUseMatches(['leagueA']);

//     let matches = [];

//     // call fetchLeagueMatches
//     await act(async () => {
//       matches = await result.current.fetchLeagueMatches('leagueA');
//     });

//     await waitFor(() => {
//       expect(matches.length).toBe(40);
//       expect(matches).toEqual(fakeServerMatches); 
//     });
//   });

//   test("CASE 3: Cache has 20 matches, no other matches exist", async () => {
//     const fakeCacheMatches = generateFakeMatches(20, 1000, 'leagueA');
//     const fakeServerMatches = [];

//     const mockFirestore = createMockFirestore({
//       cacheMatches: fakeCacheMatches,
//       serverMatches: fakeServerMatches,
//     });

//     // start fresh hook
//     const { result } = renderHook(() => useMatches(mockFirestore));
//     result.current.startUseMatches(['leagueA']);

//     let matches = [];

//     // call fetchLeagueMatches
//     await act(async () => {
//       matches = await result.current.fetchLeagueMatches('leagueA');
//     });

//     await waitFor(() => {
//       expect(matches.length).toBe(20);
//       expect(matches).toEqual(fakeCacheMatches); // Directly compare the pure array
//     });
//   });

//   test("CASE 4: Cache has 0 matches, server has 10 matches", async () => {
//     const fakeCacheMatches = [];
//     const fakeServerMatches = generateFakeMatches(10, 1000, 'leagueA');

//     const mockFirestore = createMockFirestore({
//       cacheMatches: fakeCacheMatches,
//       serverMatches: fakeServerMatches,
//     });

//     // start fresh hook
//     const { result } = renderHook(() => useMatches(mockFirestore));
//     result.current.startUseMatches(['leagueA']);

//     let matches = [];

//     // call fetchLeagueMatches
//     await act(async () => {
//       matches = await result.current.fetchLeagueMatches('leagueA');
//     });

//     await waitFor(() => {
//       expect(matches.length).toBe(10);
//       expect(matches).toEqual(fakeServerMatches); // Directly compare the pure array
//     });
//   });

//   // DISCLAIMER: This test will fail due to the nature of the mock firestore setup. If the updateSnapshot logic is removed from hook
//   // to better simulate this edge case, this test works as expected. This is a very unlikely edge case anyway.
//   // test("CASE 5: Cache has 20 matches, no new matches exist, 20 OLDER matches exist on server", async () => {
//   //   const fakeCacheMatches = generateFakeMatches(20, 4000, 'leagueA');
//   //   const fakeServerMatches = generateFakeMatches(20, 1000, 'leagueA');

//   //   const mockFirestore = createMockFirestore({
//   //     cacheMatches: fakeCacheMatches,
//   //     serverMatches: fakeServerMatches,
//   //   });

//   //   // start fresh hook
//   //   const { result } = renderHook(() => useMatches(mockFirestore));
//   //   result.current.startUseMatches(['leagueA']);

//   //   let matches = [];

//   //   // call fetchLeagueMatches
//   //   await act(async () => {
//   //     matches = await result.current.fetchLeagueMatches('leagueA');
//   //   });

//   //   const correctMatches = [...fakeCacheMatches, ...fakeServerMatches];

//   //   // console.log("correct Matches:", correctMatches, " starts at ", correctMatches[0].data().timestamp);
//   //   // console.log("fetched Matches:", matches, " starts at ", matches[0].data().timestamp);


//   //   await waitFor(() => {
//   //     expect(matches.length).toBe(40);
//   //     expect(matches).toEqual(correctMatches); // Directly compare the pure array
//   //   });
//   // });
// });

// describe('startUseMatches Tests', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   test("CASE 0: allMatches already has data", async () => {
//     const fakeCacheMatches = [];
//     const fakeServerMatches = generateFakeMatches(20, 1400, 'leagueA');

//     const mockFirestore = createMockFirestore({
//       cacheMatches: fakeCacheMatches,
//       serverMatches: fakeServerMatches,
//     });

//     // start fresh hook
//     const { result } = renderHook(() => useMatches(mockFirestore));
//     result.current.startUseMatches(['leagueA']);

//     let matches = [];

//     // call fetchLeagueMatches
//     await act(async () => {
//       matches = await result.current.fetchLeagueMatches('leagueA');
//     });

//     result.current.startUseMatches(['leagueA']); 

//     let matchesAfter = [];

//     await act(async () => {
//       matchesAfter = await result.current.fetchLeagueMatches('leagueA');
//     });

//     await waitFor(() => {
//       expect(matches.length).toBe(20);
//       expect(matchesAfter.length).toBe(20);
//       expect(matchesAfter).toEqual(matches); 
//       expect(matchesAfter).toEqual(fakeServerMatches); 
//     });
//   });

//   test("CASE 1: setLeague, leagueID that doesn't exist in allMatches", async () => {
//     const fakeCacheMatches = [];
//     const fakeServerMatches = generateFakeMatches(20, 1400, 'leagueA');

//     const mockFirestore = createMockFirestore({
//       cacheMatches: fakeCacheMatches,
//       serverMatches: fakeServerMatches,
//     });

//     // start fresh hook
//     const { result } = renderHook(() => useMatches(mockFirestore));
//     result.current.startUseMatches(['leagueA']);

    
//     // setLeague to non-existent league, should throw error
//     expect(() => 
//       result.current.setLeague('leagueB').toThrow("League not found in useMatches hook"));
//   });

//   test("CASE 2: setLeague, no matches exist for league yet", async () => {
//     const fakeCacheMatches = [];
//     const fakeServerMatches = generateFakeMatches(20, 1400, 'leagueA');

//     const mockFirestore = createMockFirestore({
//       cacheMatches: fakeCacheMatches,
//       serverMatches: fakeServerMatches,
//     });

//     // start fresh hook
//     const { result } = renderHook(() => useMatches(mockFirestore));
//     result.current.startUseMatches(['leagueA']);

    
//     expect(result.current.allMatches.current.get('leagueA').length).toBe(0);
    
   
    
//     await act(async () => {
//       await result.current.setLeague('leagueA');

//     });

//     await waitFor(() => {
//       expect(result.current.allMatches.current.get('leagueA').length).toBe(20);
//       expect(result.current.allMatches.current.get('leagueA')).toEqual(fakeServerMatches); 
//     });
//   });

//   test("CASE 3: setLeague, matches exist, window should be set correctly", async () => {
//     const fakeCacheMatches = [];
//     const fakeServerMatches = generateFakeMatches(40, 1400, 'leagueA');

//     const mockFirestore = createMockFirestore({
//       cacheMatches: fakeCacheMatches,
//       serverMatches: fakeServerMatches,
//     });

//     // start fresh hook
//     const { result } = renderHook(() => useMatches(mockFirestore));
//     result.current.startUseMatches(['leagueA']);
//     await result.current.fetchLeagueMatches('leagueA');
    
   
//     await act(async () => {
//       await result.current.setLeague('leagueA');

//     });

//     await waitFor(() => {
//       expect(result.current.matchesWindow.length).toBe(20);
//       expect(result.current.matchesWindow).toEqual(fakeServerMatches.slice(0,20)); 
//     });
//   });

//   test("CASE 4: setLeague, matches exist, window should be set correctly", async () => {
//     const fakeCacheMatches = [];
//     const fakeServerMatches = generateFakeMatches(15, 1400, 'leagueA');

//     const mockFirestore = createMockFirestore({
//       cacheMatches: fakeCacheMatches,
//       serverMatches: fakeServerMatches,
//     });

//     // start fresh hook
//     const { result } = renderHook(() => useMatches(mockFirestore));
//     result.current.startUseMatches(['leagueA']);
//     await result.current.fetchLeagueMatches('leagueA');
    
   
//     await act(async () => {
//       await result.current.setLeague('leagueA');

//     });

//     await waitFor(() => {
//       expect(result.current.matchesWindow.length).toBe(15);
//       expect(result.current.matchesWindow).toEqual(fakeServerMatches.slice(0,15)); 
//       expect(result.current.endOfMatches).toBe(true);
//     });
//   });

// });

// describe('nextPage + prevPage Tests', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   test("CASE 0: nextPage, all tests", async () => {
//     const fakeCacheMatches = [];
//     const fakeServerMatches = generateFakeMatches(60, 600, 'leagueA');

//     const mockFirestore = createPaginatedMockFirestore({
//       cacheMatches: fakeCacheMatches,
//       serverMatches: fakeServerMatches,
//     });

//     // start fresh hook
//     const { result } = renderHook(() => useMatches(mockFirestore));
//     result.current.startUseMatches(['leagueA']);

//     let matches = [];

//     await act(async () => {
//       await result.current.setLeague('leagueA');
//     });

//     matches = result.current.allMatches.current.get('leagueA');
//     console.log("All matches after initial fetch:", matches);

//     await waitFor(() => {
//       // should only have two pages (40 matches) loaded
//       // window should be first 20
//       expect(matches.length).toBe(40);
//       expect(result.current.matchesWindow).toEqual(matches.slice(0,20));
//       expect(result.current.startOfMatches).toBe(true);
//       expect(result.current.endOfMatches).toBe(false);

//     });

//     await act(async () => {
//       // Call nextPage, should shift window and fetch 20 more matches
//       await result.current.nextPage();
//     });

    

//     await waitFor(() => {
//       // window should be second 20
//       expect(result.current.matchesWindow).toEqual(matches.slice(20, 40));

//       // should be 60 matches total now
//       expect(matches.length).toBe(60);
//       expect(matches).toEqual(fakeServerMatches);

//       // one extra page should be loaded, not end of matches
//       expect(result.current.endOfMatches).toBe(false);
//       expect(result.current.startOfMatches).toBe(false);
//     });

//     await act(async () => {
//       // Call nextPage, should shift window and fetch 20 more matches
//       await result.current.nextPage();
//     });

    

//     await waitFor(() => {
//       expect(matches.length).toBe(60);
//       expect(matches).toEqual(fakeServerMatches); // Directly compare the pure array

//       // shoud be at endOfMatches now since no more matches to fetch
//       expect(result.current.matchesWindow).toEqual(matches.slice(40, 60));
//       expect(result.current.endOfMatches).toBe(true);
//       expect(result.current.startOfMatches).toBe(false);
//     });

//     await act(async () => {
//       // Call nextPage at endOfMatches, should throw error
//       expect(() => 
//         result.current.nextPage().toThrow("error"));
//     });
//   });

//   test("CASE 1: prevPage, all tests", async () => {
//     const fakeCacheMatches = [];
//     const fakeServerMatches = generateFakeMatches(80, 600, 'leagueA');

//     const mockFirestore = createPaginatedMockFirestore({
//       cacheMatches: fakeCacheMatches,
//       serverMatches: fakeServerMatches,
//     });

//     // start fresh hook
//     const { result } = renderHook(() => useMatches(mockFirestore));
//     result.current.startUseMatches(['leagueA']);

//     let matches = [];

//     await act(async () => {
//       await result.current.setLeague('leagueA');
//     });

//     matches = result.current.allMatches.current.get('leagueA');
//     console.log("All matches after initial fetch:", matches);

//     await waitFor(() => {
//       // should only have two pages (40 matches) loaded
//       // window should be first 20
//       expect(matches.length).toBe(40);
//       expect(result.current.matchesWindow).toEqual(matches.slice(0,20));
//       expect(result.current.startOfMatches).toBe(true);
//       expect(result.current.endOfMatches).toBe(false);

//     });

//     await act(async () => {
//       // startOfMatches should be true
//       expect(result.current.startOfMatches).toBe(true);

//       // Call prevPage at startOfMatches, should throw error
//       expect(() => 
//         result.current.prevPage().toThrow("error"));
//     });

    

//     await waitFor(() => {
//       // window should be first 20
//       expect(result.current.matchesWindow).toEqual(matches.slice(0, 20));

//       // should be 40 matches total still
//       expect(matches.length).toBe(40);
//       expect(matches).toEqual(fakeServerMatches.slice(0,40));

//       // should still be at startOfMatches, end of matches false
//       expect(result.current.endOfMatches).toBe(false);
//       expect(result.current.startOfMatches).toBe(true);
//     });

//     await act(async () => {
//       // Call nextPage 3 times to reach end
//       await result.current.nextPage();
//       await result.current.nextPage();
//       await result.current.nextPage();
//     });

    

//     await waitFor(() => {
//       expect(matches.length).toBe(80);
//       expect(matches).toEqual(fakeServerMatches); // Directly compare the pure array

//       // shoud be at endOfMatches now since no more matches to fetch
//       expect(result.current.matchesWindow).toEqual(matches.slice(60, 80));
//       expect(result.current.endOfMatches).toBe(true);
//       expect(result.current.startOfMatches).toBe(false);
//     });

//     await act(async () => {
//       await result.current.prevPage();
//     });

//     await waitFor(() => {
//       // window should be second 20
//       expect(result.current.matchesWindow).toEqual(matches.slice(40, 60));
//       expect(result.current.endOfMatches).toBe(false);
//       expect(result.current.startOfMatches).toBe(false);
//     });

//     await act(async () => {
//       await result.current.prevPage();
//     });

//     await waitFor(() => {
//       // window should be second 20
//       expect(result.current.matchesWindow).toEqual(matches.slice(20, 40));
//       expect(result.current.endOfMatches).toBe(false);
//       expect(result.current.startOfMatches).toBe(false);
//     });

//     await act(async () => {
//       await result.current.prevPage();
//     });

//     await waitFor(() => {
//       // window should be second 20
//       expect(result.current.matchesWindow).toEqual(matches.slice(0, 20));
//       expect(result.current.endOfMatches).toBe(false);
//       expect(result.current.startOfMatches).toBe(true);
//     });
//   });


// }); */