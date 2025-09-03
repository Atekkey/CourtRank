import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Platform, Modal, RefreshControl } from 'react-native';
import { getLeagues, joinLeague } from '../../services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';
import { osName } from 'expo-device';

export default function DiscoverLeagues() {
  const [leagues, setLeagues] = useState([]);
  const [filteredLeagues, setFilteredLeagues] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, userInfo, isLoading } = useAuth();
  const [showPassModal, setShowPassModal] = useState(false);
  const [password, setPassword] = useState("");
  const [hiddenPass, setHiddenPass] = useState("");
  const [selLeague, setSelLeague] = useState(null);

  // Set Refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      console.log("Refreshed!");
      setRefreshing(false);
    }, 2000);
  };
  
  const fetchLeagues = useCallback(async () => {
    try {
      setError(null);
      if (!refreshing) setLoading(true); // avoid double spinners
      const fetchedLeagues = await getLeagues();
      setLeagues(fetchedLeagues);
      setFilteredLeagues(fetchedLeagues);
    } catch (err) {
      console.error("Error fetching leagues:", err);
      setError("Failed to load leagues. Please try again.");
      setLeagues([]);
      setFilteredLeagues([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchLeagues();
  }, [fetchLeagues]);
  
  // NEW: Fetch leagues from database on component mount
  // useEffect(() => {
  //   const fetchLeagues = async () => {
  //     try {
  //       setLoading(true);
  //       setError(null);
  //       const fetchedLeagues = await getLeagues();
  //       setLeagues(fetchedLeagues);
  //       setFilteredLeagues(fetchedLeagues);
  //     } catch (err) {
  //       console.error('Error fetching leagues:', err);
  //       setError('Failed to load leagues. Please try again.');
  //       // Fallback to empty array on error
  //       setLeagues([]);
  //       setFilteredLeagues([]);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchLeagues();
  // }, []);

  // Filter leagues based on search query and selected level
  useEffect(() => {
    let filtered = leagues;

    // Filter by search query (sport name)
    if (searchQuery.trim()) {
      filtered = filtered.filter(league =>
        league.league_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredLeagues(filtered);
  }, [searchQuery, leagues]);

  const joinLeagueClicked = (league) => {
    if (league.is_public) {
      handleJoinLeague(league.league_id);
    } else {
      initialPassClicked(league);
    }
  };

  const handleJoinLeague = async (leagueId) => {
    if (!user || !user?.uid) {
      if (Platform.OS === 'web') {
        window.alert('You must be logged in to join a league');
        return;
      }
      Alert.alert('Error', 'You must be logged in to join a league');
      return;
    }
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to join this league?')) {
        try {
          await joinLeague(leagueId, user?.uid);
          Alert.alert('Success', 'You have joined the league!');
          const updatedLeagues = await getLeagues();
          setLeagues(updatedLeagues);
        } catch (joinError) {
          console.error('Error joining league:', joinError);
          Alert.alert('Error', 'Failed to join league. Please try again.');
        }
      }
    } else {
      try {
        Alert.alert(
          'Join League',
          'Are you sure you want to join this league?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Join', 
              onPress: async () => {
                try {
                  await joinLeague(leagueId, user?.uid);
                  Alert.alert('Success', 'You have joined the league!');
                  const updatedLeagues = await getLeagues();
                  setLeagues(updatedLeagues);
                } catch (joinError) {
                  console.error('Error joining league:', joinError);
                  Alert.alert('Error', 'Failed to join league. Please try again.');
                }
              }
            }
          ]
        );
      } catch (error) {
        Alert.alert('Error', 'Failed to join league. Please try again.');
      }
    }
  };

  // NEW: Loading state UI
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading leagues...</Text>
      </View>
    );
  }

  // NEW: Error state UI
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            // Retry fetching leagues
            const fetchLeagues = async () => {
              try {
                setLoading(true);
                setError(null);
                const fetchedLeagues = await getLeagues();
                setLeagues(fetchedLeagues);
                setFilteredLeagues(fetchedLeagues);
              } catch (err) {
                setError('Failed to load leagues. Please try again.');
              } finally {
                setLoading(false);
              }
            };
            fetchLeagues();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initialPassClicked = (league) => {
    setShowPassModal(true);
    setHiddenPass(league.password);
    setSelLeague(league);
  };

  const passUnclicked = () => {
    setShowPassModal(false);
    setPassword("");
    setHiddenPass("");
    setSelLeague(null);
  };

  const attemptJoin = async () => {
    if ((password === hiddenPass) && (password !== "") && selLeague) {
      await handleJoinLeague(selLeague.league_id);
      passUnclicked();
    } else {
      if (Platform.OS === 'web') {
        window.alert('Incorrect password. Please try again.');
      } else {
        Alert.alert('Error', 'Incorrect password. Please try again.');
      }
    }
  };

  const passModal = (
      <Modal
          visible={showPassModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => {passUnclicked()} }
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Password</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {passUnclicked()}}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
  
            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password *</Text>
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={(text) => setPassword(text)}
                  placeholder=""
                  maxLength={20}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {passUnclicked()}}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.enterButton}
                onPress={() => {attemptJoin();}}
              >
                <Text style={styles.enterButtonText}>Join League</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
    );

  return (
    <ScrollView style={styles.container} 
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>}
    >
      {passModal}
      <View style={styles.header}>
        <Text style={styles.title}>Discover Leagues</Text>
        <Text style={styles.subtitle}>Find and join leagues near you</Text>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by League Name (e.g., Basketball, Tennis)"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
          
          
        />
      </View>

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredLeagues.length} league{filteredLeagues.length !== 1 ? 's' : ''} found
        </Text>
        {(searchQuery !== '') && (
          <TouchableOpacity 
            onPress={() => {
              setSearchQuery('');
            }}
          >
            <Text style={styles.clearFiltersText}>Clear Filter</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Leagues List */}
      {filteredLeagues.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No leagues found</Text>
          <Text style={styles.noResultsSubtext}>Try adjusting your search or filters</Text>
        </View>
      ) : (
        filteredLeagues.map(league => (
          <View key={league.league_id} style={styles.leagueCard}>
            

            <View style={styles.leagueInfoContainer}>
              <View style={styles.leagueMainInfo}>
                <Text style={styles.leagueName}>{league.league_name}</Text>
                {league.description && <Text style={styles.leagueDescription}>{league.description}</Text>}
              </View>
              <View style={styles.leagueStats}>
                  <Text style={styles.leagueInfo}>
                    👥 <b>{league.players.length}</b> Competitors
                  </Text>
                
                {league.location && <Text style={styles.leagueInfo}>📍{league.location}</Text>}
                <Text style={styles.leagueInfo}>
                  📅 Start: {league.created_at.toDate().toLocaleDateString()}
                  {/* {league.league_end ? league.league_end.toDate().toLocaleDateString() : '♾️'} */}
                </Text>
                <Text style={styles.leagueInfo}>🚩 End: {league.league_end ? league.league_end.toDate().toLocaleDateString() : 'Never'}</Text>
                

              </View>
            </View>
            
            <TouchableOpacity
              style={[
                styles.joinButton,
                league.players.some(player => player === user?.uid) && styles.joinButtonDisabled,
                (!league.is_public && !league.players.some(player => player === user?.uid)) &&
                 {backgroundColor: 'orange'}
              ]}
              onPress={() => joinLeagueClicked(league)}
              disabled={league.players.some(player => player === user?.uid)}
            >
              <Text style={styles.joinButtonText}>
                {(() => {
                  if (user?.uid && league.players.some(player => player === user?.uid)) {
                    return 'Already Joined';
                  } else if(!(league.is_public)) {
                    return '🔒 Enter Password';
                  } else {
                    return 'Join League';
                  }
                })()}
              </Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#8E24AA',
    
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  enterButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    marginLeft: 10,
  },
  enterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  // NEW: Center content style for loading and error states
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // NEW: Loading text style
  loadingText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  // NEW: Error text style
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  // NEW: Retry button styles
  retryButton: {
    backgroundColor: '#8E24AA',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    padding: 20,
    alignItems: 'center',

    paddingTop: osName === 'iOS' ? 40 : 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8E24AA',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  searchContainer: {
    paddingHorizontal: 15,
  },
  searchInput: {
    backgroundColor:'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  
  searchSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 80,
  },
  filterButtonActive: {
    backgroundColor: '#8E24AA',
    borderColor: '#8E24AA',
  },
  filterText: {
    color: '#8E24AA',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  filterTextActive: {
    color: 'white',
  },
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  resultsText: {
    fontSize: 16,
    color: '#666',
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#8E24AA',
    fontWeight: '500',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  leagueCard: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },
  leagueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8E24AA',
    marginBottom: 10,

    
    maxWidth: '95%',
    
  },
  leagueInfo: {
    fontSize: 16,
    color: '#666',
    marginVertical: 2,
  },
  leagueMainInfo: {
   

    width: '50%',
  },
  leagueInfoContainer: {
    display: 'flex',
    flexDirection: 'row',

 
  },
  leagueStats: {
    width: '50%',
  },
  leagueDescription: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    maxWidth: '95%',
  },
  joinButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
  },
  joinButtonDisabled: {
    backgroundColor: '#ccc',
  },
  joinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});