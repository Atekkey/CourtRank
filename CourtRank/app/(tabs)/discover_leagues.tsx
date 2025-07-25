import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Platform } from 'react-native';
import { getLeagues, joinLeague } from '../../services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';

// REMOVED: Mock data - now fetching from database

export default function DiscoverLeagues() {
  // CHANGED: Initialize with empty array instead of mock data
  const [leagues, setLeagues] = useState([]);
  const [filteredLeagues, setFilteredLeagues] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  // NEW: Loading state for better UX
  const [loading, setLoading] = useState(true);
  // NEW: Error state handling
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // NEW: Fetch leagues from database on component mount
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedLeagues = await getLeagues();
        setLeagues(fetchedLeagues);
        setFilteredLeagues(fetchedLeagues);
      } catch (err) {
        console.error('Error fetching leagues:', err);
        setError('Failed to load leagues. Please try again.');
        // Fallback to empty array on error
        setLeagues([]);
        setFilteredLeagues([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeagues();
  }, []);

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

  const handleJoinLeague = async (leagueId) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to join this league?')) {
        try {
          await joinLeague(leagueId, user.uid);
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
                  await joinLeague(leagueId, user.uid);
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

  return (
    <ScrollView style={styles.container}>
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
          <View key={league.id} style={styles.leagueCard}>
            <Text style={styles.leagueName}>{league.league_name}</Text>
            <Text style={styles.leagueInfo}>📍{league.location_str}</Text>
            <Text style={styles.leagueInfo}>
              📅 {league.created_at.toDate().toLocaleDateString()} ➡️ 
              {league.league_end ? league.league_end.toDate().toLocaleDateString() : ''}
            </Text>
            
            <Text style={styles.leagueInfo}>
              👥 Members: {league.players.length}/{100}
            </Text>
            {/* <Text style={styles.leagueDescription}>{league.description}</Text> */}
            
            <TouchableOpacity
              style={[
                styles.joinButton,
                league.players.length >= 100 && styles.joinButtonDisabled
              ]}
              onPress={() => handleJoinLeague(league.league_id)}
              disabled={league.players.length >= 100}
            >
              <Text style={styles.joinButtonText}>
                {(() => {
                  if (user.uid && league.players.some(player => player.id === user.uid)) {
                    return 'Already Joined';
                  } else if (league.players.length >= 100) {
                    return 'League Full';
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
    backgroundColor: '#2f95dc',
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
    backgroundColor: '#2f95dc',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    marginTop: 5,
  },
  searchContainer: {
    padding: 15,
    backgroundColor: 'white',
  },
  searchInput: {
    backgroundColor: '#f8f8f8',
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
    backgroundColor: '#2f95dc',
    borderColor: '#2f95dc',
  },
  filterText: {
    color: '#2f95dc',
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
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  resultsText: {
    fontSize: 16,
    color: '#666',
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#2f95dc',
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
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leagueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f95dc',
    marginBottom: 10,
  },
  leagueInfo: {
    fontSize: 16,
    color: '#666',
    marginVertical: 2,
  },
  leagueDescription: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    fontStyle: 'italic',
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