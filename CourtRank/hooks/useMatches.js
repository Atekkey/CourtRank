// useMatches hook
import { useState, useRef, useEffect } from 'react';
import { collection, query, where, orderBy, limit, startAfter, endBefore, getDocsFromCache, getDocsFromServer, documentId } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';


export function useMatches() {
  console.log("useMatches hook initialized");
 
  // stateHooks:
  const [matchesWindow, setMatchesWindow] = useState([]);

  // page index (to get window)
  const page = useRef(0);
  const pageSize = useRef(2);

  // Map<leagueID, matches[]> allMatches
  const allMatches = useRef(new Map());

  // currLeague
  const currLeague = useRef(null);

  // !! Maybe have boolean value telling if reached end of matches for currLeague (so no more next page)
  // const [endOfMatches, setEndOfMatches] = useState(false);
  // const [startOfMatches, setStartOfMatches] = useState(true);

  // useRef + useState combo to have both mutable ref and state trigger
  const endOfMatches = useRef(false);
  const [endOfMatchesState, setEndOfMatchesState] = useState(false);

  const startOfMatches = useRef(true);
  const [startOfMatchesState, setStartOfMatchesState] = useState(true);

  const toggleEndofMatches = (value) => {
    endOfMatches.current = value;
    setEndOfMatchesState(value);
  };

  const toggleStartOfMatches = (value) => {
    startOfMatches.current = value;
    setStartOfMatchesState(value);
  }


// !!! THOUGHTS
// If duplicates are within the same page, something weird is happening
// but if they are between pages, it is an issue with firebase pagination and startAfter queries
  const checkForDupeIDs = () => {
    const matches = allMatches.current.get(currLeague.current);
    if (!matches || matches.length === 0) {
      return { hasDuplicates: false, duplicateIds: [] };
    }

    const ids = matches.map(match => match.id);
    const idSet = new Set(ids);

    // console.log("useMatches: allIds: ", ids);

    // If set size is less than array size, there are duplicates
    if (idSet.size < ids.length) {
      // Find which IDs are duplicated
      const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
      const uniqueDuplicateIds = [...new Set(duplicateIds)];
      
      // Log the match data for each duplicate ID
      uniqueDuplicateIds.forEach(dupeId => {
        const dupeMatches = matches.filter(match => match.id === dupeId);
        console.warn(`useMatches: Duplicate ID "${dupeId}" found in ${dupeMatches.length} matches:`, dupeMatches);
      });
      
      return { hasDuplicates: true, duplicateIds: uniqueDuplicateIds };
    }

    return { hasDuplicates: false, duplicateIds: [] };
  }

  useEffect(() => {
    console.log("useMatches: endOfMatches changed to ", endOfMatches.current, endOfMatchesState);
  }, [endOfMatchesState]);

  useEffect(() => {
    console.log("useMatches: startOfMatches changed to ", startOfMatches.current, startOfMatchesState);
  }, [startOfMatchesState]);

  useEffect(() => {
    const result = checkForDupeIDs();
    if (result.hasDuplicates) {
      console.warn("useMatches: Duplicate match IDs detected:", result.duplicateIds);
    }
  }, [matchesWindow]);

  // funcs:
  //  fetchMatches (Ids[]) (fetches matches given league array)
  
  async function startUseMatches(leagueIDs) {
    // params: user league_ids
    // This essesntially initializes the hook with some data
    // Will populate allMatches map with a key for each leagueID

    // need to clear all vars using useRef first to eliminate stale data
    allMatches.current = new Map();
    page.current = 0;
    // setEndOfMatches(false);
    // setStartOfMatches(true);
    toggleEndofMatches(false);
    toggleStartOfMatches(true);
    
    // endOfMatches.current = false;
    // startOfMatches.current = true;


    for (const leagueID of leagueIDs) {
      allMatches.current.set(leagueID, []);
    }

    console.log("useMatches hook initialized with leagues: ", leagueIDs);

  }

  async function setLeague(leagueID) {
    console.log("useMatches: setting league to ", leagueID);
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

      // startOfMatches.current = true;
      toggleStartOfMatches(true);
      // setStartOfMatches(true);

      


      // set matchesWindow to first page of matches
      // uses current page and page size to calculate window 
      if (matches.length <= pageSize.current) {
        // if less than one page of matches, set endOfMatches to true
        console.log("useMatches: less than one page of matches, setting endOfMatches to true");
        // endOfMatches.current = true;
        toggleEndofMatches(true);
        // setEndOfMatches(true);
        setMatchesWindow(matches.slice(0, matches.length));
      } else {
        console.log("useMatches: setting matches window to first page");
        // endOfMatches.current = false;
        toggleEndofMatches(false);
        // setEndOfMatches(false);
        setMatchesWindow(matches.slice(0, pageSize.current));
      }
      // setMatchesWindow(allMatches.current.get(leagueID).slice(page.current * pageSize.current, (page.current + 1) * pageSize.current));
      
      console.log("useMatches: league set with window size ", matchesWindow.length);

    } catch (error) {
      throw error;

    }


  }

  // fetch first 40 matches for a single leagueID, checking cache first
  async function fetchLeagueMatches(leagueID) {
    console.log("useMatches: fetching matches for league ", leagueID);
    // const { collection, query, getDocsFromCache, getDocsFromServer, where, orderBy, db, limit, endBefore, startAfter } = await import('firebase/firestore');
    try {
      const cacheQ = query(
        collection(db, 'matches'),
        where('league_id', '==', leagueID),
        orderBy('timestamp', 'desc'),
        orderBy(documentId(), 'desc'), // ordering by documentId also to ensure deterministic ordering in case of equal timestamps
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
          orderBy(documentId(), 'desc'),
          limit(pageSize.current * 2)
        );
        const serverSnapshot = await getDocsFromServer(serverQ);

        serverSnapshot.forEach((doc) => {
          matches.push({id: doc.id, ...doc.data()});
        });

        console.log("Number of matches fetched from server: ", matches.length);

        return matches;

    

      } 


      // Check for existing matches newer than latest cached match
      const updateQuery = query(
        collection(db, 'matches'),
        where('league_id', '==', leagueID),
        orderBy('timestamp', 'desc'),
        orderBy(documentId(), 'desc'),
        endBefore(cacheSnapshot.docs[0]),
        limit(pageSize.current * 2) // also use limit in case of large gap between cache and server to prevent excessive reads
      );

      const updateSnapshot = await getDocsFromServer(updateQuery);

      if (!updateSnapshot.empty) {

        // updates found, add to matches
        updateSnapshot.forEach((doc) => {
            matches.push({id: doc.id, ...doc.data()});
        });

        if (updateSnapshot.docs.length >= pageSize.current * 2) {
          // assume stale cache, just return updates
          return matches

        }


      }


          
      // updates connect to cache, include cached data
      cacheSnapshot.forEach((doc) => {
        matches.push({id: doc.id, ...doc.data()});
      });



      // if < 2 pages of matches exist, check for older matches
      // just an edge case if matches were cached, then some older matches were deleted from cache 
      if (matches.length < pageSize.current * 2) {
        const gapQuery = query(
          collection(db, 'matches'),
          where('league_id', '==', leagueID),
          orderBy('timestamp', 'desc'),
          orderBy(documentId(), 'desc'),
          startAfter(cacheSnapshot.docs[cacheSnapshot.docs.length - 1]),
          limit((pageSize.current * 2) - matches.length)
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
            //!! maybe set endOfMatches to false here? just to prevent user from clicking fast and breaking

          if (page.current > 0) { // this might be redundant but is careful
            toggleStartOfMatches(false);
            // startOfMatches.current = false;
            // setStartOfMatches(false);
          }
          
          console.log("useMatches: moved to next page, current page ", page.current);
        }

        // only query if at end of matches array, so a backup page is needed
        const newWindowEnd = (page.current + 1) * pageSize.current;


        if (matches.length <= newWindowEnd) {
                  console.log("useMatches: fetching next page from server...");
          console.log("last match : " , matches[matches.length - 1]);
          // then query for next page of matches
          const q = query(
            collection(db, 'matches'),
            where('league_id', '==', currLeague.current),
            orderBy('timestamp', 'desc'),
            orderBy(documentId(), 'desc'), // ordering by documentID also to ensure deterministic ordering in case of equal timestamps
            startAfter(matches[matches.length - 1].timestamp),
            limit(pageSize.current)
          );


          const querySnapshot = await getDocsFromServer(q);

          // if snaphot empty, this is end of matches
          if (querySnapshot.empty) {
            console.log("useMatches, nextPage: reached end of matches from server");
            toggleEndofMatches(true);
            validateMapAgainstAllMatches(currLeague.current);
            // endOfMatches.current = true;
            // setEndOfMatches(true);

            console.log("useMatches: endOfMatches = ", endOfMatches);
          }


          // update allMatches map with querySnapshot
          querySnapshot.forEach((doc) => {
            matches.push({id: doc.id, ...doc.data()});
          });
          
          allMatches.current.set(currLeague.current, matches);

        }
      } else {
        throw new Error("Already at end of matches, cannot go to next page");
        
      }


    } catch (error) {
      throw error;
    }
  }
  // prevPage()

  async function prevPage() {
    try {
      if (startOfMatches.current) {
        throw new Error("Already at start of matches, cannot go to previous page");
      }

      // decrement page number
      page.current = page.current - 1;

      if (endOfMatches.current) {
        // if at endOfMatches, then going back means we are no longer at end
        toggleEndofMatches(false);
        // endOfMatches.current = false;
        // setEndOfMatches(false);
      }

      // set new window based on page number
      setMatchesWindow(allMatches.current.get(currLeague.current).slice(page.current * pageSize.current, (page.current + 1) * pageSize.current));

      // check if start of pages
      if (page.current < 1) {
        toggleStartOfMatches(true);
        // startOfMatches.current = true;
        // setStartOfMatches(true);
      }

    } catch (error) {
      throw error;
    }
  }

  // Query all matches for a league and compare with map
  async function validateMapAgainstAllMatches(leagueID) {
    console.log("useMatches: validating map against all matches for league", leagueID);
    
    try {
      if (!allMatches.current.has(leagueID)) {
        throw new Error('League not found in useMatches hook');
      }

      // Query all matches for this league
      const allMatchesQuery = query(
        collection(db, 'matches'),
        where('league_id', '==', leagueID),
        orderBy('timestamp', 'desc'),
        orderBy(documentId(), 'desc')
      );

      const allMatchesSnapshot = await getDocsFromServer(allMatchesQuery);
      const allMatchesFromDB = [];

      allMatchesSnapshot.forEach((doc) => {
        allMatchesFromDB.push({ id: doc.id, ...doc.data() });
      });

      // Get matches from map
      const mapMatches = allMatches.current.get(leagueID);

      // Create sets of IDs for comparison
      const dbIds = new Set(allMatchesFromDB.map(m => m.id));
      const mapIds = new Set(mapMatches.map(m => m.id));

      // Find differences
      const missingFromMap = [...dbIds].filter(id => !mapIds.has(id));
      const extraInMap = [...mapIds].filter(id => !dbIds.has(id));

      // Log results
      console.log(`useMatches: Validation Results for League ${leagueID}:`);
      console.log(`  Total matches in DB: ${allMatchesFromDB.length}`);
      console.log(`  Total matches in map: ${mapMatches.length}`);
      console.log(`  Match count - ${dbIds.size === mapIds.size ? 'PASS' : 'FAIL'}`);

      if (missingFromMap.length > 0) {
        console.warn(`  Missing from map (${missingFromMap.length}):`, 
          allMatchesFromDB.filter(m => missingFromMap.includes(m.id)));
      } else {
        console.log('  Missing from map: NONE');
      }

      if (extraInMap.length > 0) {
        console.warn(`  Extra in map (${extraInMap.length}):`, 
          mapMatches.filter(m => extraInMap.includes(m.id)));
      } else {
        console.log('  Extra in map: NONE');
      }

      const isValid = missingFromMap.length === 0 && extraInMap.length === 0;
      console.log(`  Overall validation: ${isValid ? 'PASS' : 'FAIL'}`);

      return {
        isValid,
        dbCount: allMatchesFromDB.length,
        mapCount: mapMatches.length,
        missingFromMap,
        extraInMap,
        allDBMatches: allMatchesFromDB
      };

    } catch (error) {
      console.error("useMatches: Error validating map against all matches:", error);
      throw error;
    }
  }

  return {matchesWindow, startUseMatches, setLeague, nextPage, prevPage, endOfMatches: endOfMatchesState, startOfMatches: startOfMatchesState, validateMapAgainstAllMatches};

}

// Modified useMatches hook with mockFirestore parameter for testing
export function useMatchesJest(mockFirestore) {
    const { collection, query, getDocsFromCache, getDocsFromServer, where, orderBy, limit, startAfter, endBefore, db } = mockFirestore;

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
      allMatches.current.set(leagueID, []);
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

      startOfMatches.current = true;
      


      // set matchesWindow to first page of matches
      // uses current page and page size to calculate window 
      if (matches.length <= pageSize.current) {
        // if less than one page of matches, set endOfMatches to true
        endOfMatches.current = true;
        setMatchesWindow(matches.slice(0, matches.length));
      } else {
        endOfMatches.current = false;
        setMatchesWindow(matches.slice(0, pageSize.current));
      }
      // setMatchesWindow(allMatches.current.get(leagueID).slice(page.current * pageSize.current, (page.current + 1) * pageSize.current));
      

    } catch (error) {
      throw error;

    }


  }

  // fetch first 40 matches for a single leagueID, checking cache first
  async function fetchLeagueMatches(leagueID) {
    // const { collection, query, getDocsFromCache, getDocsFromServer, where, orderBy, db, limit, endBefore, startAfter } = await import('firebase/firestore');
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

        console.log("Number of matches fetched from server: ", matches.length);

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

        // console.log("page size: ", pageSize.current);
        // console.log("pageSize * 2: ", pageSize.current * 2);
        // console.log("Number of updates found: ", updateSnapshot.docs.length);
        // console.log("40 updates matches: " , updateSnapshot.docs.length >= pageSize * 2);

        // console.log("docs length:", updateSnapshot.docs.length, "pageSize:", pageSize, "computed:", pageSize * 2, "comparison:", updateSnapshot.docs.length >= pageSize * 2);
        
        // updates found, add to matches
        updateSnapshot.forEach((doc) => {
            matches.push({id: doc.id, ...doc.data()});
        });

        if (updateSnapshot.docs.length >= pageSize.current * 2) {
          // assume stale cache, just return updates
          return matches

        }


      }


          
      // updates connect to cache, include cached data
      cacheSnapshot.forEach((doc) => {
        matches.push({id: doc.id, ...doc.data()});
      });



      // if < 2 pages of matches exist, check for older matches
      // just an edge case if matches were cached, then some older matches were deleted from cache 
      if (matches.length < pageSize.current * 2) {
        const gapQuery = query(
          collection(db, 'matches'),
          where('league_id', '==', leagueID),
          orderBy('timestamp', 'desc'),
          orderBy('league_id', 'desc'),
          startAfter(cacheSnapshot.docs[cacheSnapshot.docs.length - 1]),
          limit((pageSize.current * 2) - matches.length)
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
          await setMatchesWindow(matches.slice(page.current * pageSize.current, 
            Math.min((page.current + 1) * pageSize.current), matches.length));

          // if (page.current > 0) {
          //   startOfMatches.current = false;
          // }
          startOfMatches.currrent = false;
          

        }

        // only query if at end of matches array, so a backup page is needed
        const newWindowEnd = (page.current + 1) * pageSize.current;

        if (matches.length <= newWindowEnd) {
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

        }
      } else {
        throw new Error("Already at end of matches, cannot go to next page");
        
      }


    } catch (error) {
      throw error;
    }
  }
  // prevPage()

  async function prevPage() {
    try {
      if (startOfMatches.current) {
        throw new Error("Already at start of matches, cannot go to previous page");
      }

      // decrement page number
      page.current = page.current - 1;

      if (endOfMatches.current) {
        // if at endOfMatches, then going back means we are no longer at end
        endOfMatches.current = false;
      }

      // set new window based on page number
      setMatchesWindow(allMatches.current.get(currLeague.current).slice(page.current * pageSize.current, (page.current + 1) * pageSize.current));

      // check if start of pages
      if (page.current < 1) {
        startOfMatches.current = true;
      }

    } catch (error) {
      throw error;
    }
  }

  // return fetchLeagueMatches, allMatches only for testing purposes
  return {fetchLeagueMatches, allMatches, matchesWindow, startUseMatches, setLeague, nextPage, prevPage, endOfMatches: endOfMatches.current, startOfMatches: startOfMatches.current };

}