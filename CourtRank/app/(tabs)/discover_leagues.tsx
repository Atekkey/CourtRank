import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { getLeagues, joinLeague } from '../../services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';


// Need to remove later, mock data
const mockLeagues = [
  {
    id: '1',
    name: 'Downtown Basketball League',
    sport: 'Basketball',
    location: 'Downtown Community Center',
    members: 24,
    maxMembers: 30,
    description: 'Competitive basketball league for intermediate players'
  },
  {
    id: '2',
    name: 'Riverside Tennis Club',
    sport: 'Tennis',
    location: 'Riverside Park',
    members: 12,
    maxMembers: 20,
    description: 'Friendly tennis matches for beginners'
  },
  {
    id: '3',
    name: 'City Soccer Championship',
    sport: 'Soccer',
    location: 'City Sports Complex',
    members: 45,
    maxMembers: 50,
    description: 'Competitive soccer league for advanced players'
  },
  {
    id: '4',
    name: 'Morning Volleyball League',
    sport: 'Volleyball',
    location: 'Beach Courts',
    members: 18,
    maxMembers: 24,
    description: 'Early morning volleyball matches'
  },
  {
    id: '5',
    name: 'Elite Basketball Pro',
    sport: 'Basketball',
    location: 'Elite Sports Center',
    members: 16,
    maxMembers: 20,
    description: 'High-level basketball competition'
  }
];

export default function DiscoverLeagues() {
  const [leagues, setLeagues] = useState(mockLeagues);
  const [filteredLeagues, setFilteredLeagues] = useState(mockLeagues);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  // Filter leagues based on search query and selected level
  useEffect(() => {
    let filtered = leagues;

    // Filter by search query (sport name)
    if (searchQuery.trim()) {
      filtered = filtered.filter(league =>
        league.sport.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }


    setFilteredLeagues(filtered);
  }, [searchQuery, leagues]);

  const handleJoinLeague = async (leagueId) => {
    try {
      Alert.alert(
        'Join League',
        'Are you sure you want to join this league?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Join', 
            onPress: async () => {
              // Uncomment when Firebase service is ready
              // await joinLeague(leagueId, user.uid);
              Alert.alert('Success', 'You have joined the league!');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to join league. Please try again.');
    }
  };

  

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
          placeholder="Search by Activity (e.g., Basketball, Tennis)"
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
        {(searchQuery !== 'All') && (
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
            <Text style={styles.leagueName}>{league.name}</Text>
            <Text style={styles.leagueInfo}>🏆 Sport: {league.sport}</Text>
            <Text style={styles.leagueInfo}>📍 Location: {league.location}</Text>
            <Text style={styles.leagueInfo}>
              👥 Members: {league.members}/{league.maxMembers}
            </Text>
            <Text style={styles.leagueDescription}>{league.description}</Text>
            
            <TouchableOpacity
              style={[
                styles.joinButton,
                league.members >= league.maxMembers && styles.joinButtonDisabled
              ]}
              onPress={() => handleJoinLeague(league.id)}
              disabled={league.members >= league.maxMembers}
            >
              <Text style={styles.joinButtonText}>
                {league.members >= league.maxMembers ? 'League Full' : 'Join League'}
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