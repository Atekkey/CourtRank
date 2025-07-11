import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { getUserLeagues, leaveLeague } from '../../services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';

// Mock data for demonstration (replace with real Firebase data)
const mockMyLeagues = [
  {
    id: '1',
    name: 'Downtown Basketball League',
    sport: 'Basketball',
    location: 'Downtown Community Center',
    members: 24,
    maxMembers: 30,
    description: 'Competitive basketball league',
    userStats: {
      rank: 3,
      elo: 1847,
      wins: 12,
      losses: 4,
      ties: 2,
      gamesPlayed: 18
    }
  },
  {
    id: '2',
    name: 'Riverside Tennis Club',
    sport: 'Tennis',
    location: 'Riverside Park',
    members: 12,
    maxMembers: 20,
    description: 'Friendly tennis matches',
    userStats: {
      rank: 7,
      elo: 1324,
      wins: 8,
      losses: 6,
      ties: 0,
      gamesPlayed: 14
    }
  },
  {
    id: '3',
    name: 'Morning Volleyball League',
    sport: 'Volleyball',
    location: 'Beach Courts',
    members: 18,
    maxMembers: 24,
    description: 'Early morning volleyball matches',
    userStats: {
      rank: 1,
      elo: 2103,
      wins: 15,
      losses: 2,
      ties: 1,
      gamesPlayed: 18
    }
  }
];

export default function MyLeagues() {
  const [myLeagues, setMyLeagues] = useState(mockMyLeagues);
  const { user } = useAuth();

  const handleLogGame = async (leagueId, leagueName) => {
    try {
      Alert.alert(
        'Log Game',
        `Record a game result for "${leagueName}"`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Log Game', 
            onPress: () => {
              // Navigate to game logging screen or show modal
              // For now, just show a success message
              Alert.alert('Coming Soon', 'Game logging feature will be implemented soon!');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to log game. Please try again.');
    }
  };

  const handleLeaveLeague = async (leagueId, leagueName) => {
    try {
      Alert.alert(
        'Leave League',
        `Are you sure you want to leave "${leagueName}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Leave', 
            style: 'destructive',
            onPress: async () => {
              // Uncomment when Firebase service is ready
              // await leaveLeague(leagueId, user.uid);
              setMyLeagues(prev => prev.filter(league => league.id !== leagueId));
              Alert.alert('Success', 'You have left the league.');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to leave league. Please try again.');
    }
  };

  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank <= 3) return '#C0C0C0'; // Silver
    if (rank <= 5) return '#CD7F32'; // Bronze
    return '#666'; // Default
  };

  const getEloColor = (elo) => {
    if (elo >= 2000) return '#4CAF50'; // Green for high ELO
    if (elo >= 1600) return '#FF9800'; // Orange for medium ELO
    if (elo >= 1200) return '#2196F3'; // Blue for decent ELO
    return '#666'; // Gray for low ELO
  };

  const getWinRate = (wins, losses, ties) => {
    const total = wins + losses + ties;
    if (total === 0) return 0;
    return ((wins + ties * 0.5) / total * 100).toFixed(1);
  };

  const toggleFilter = (filter) => {
    setSelectedFilter(selectedFilter === filter ? 'All' : filter);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Leagues</Text>
        <Text style={styles.subtitle}>Track your performance and rankings</Text>
      </View>

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {myLeagues.length} league{myLeagues.length !== 1 ? 's' : ''} joined
        </Text>
      </View>

      {/* Leagues List */}
      {myLeagues.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No leagues found</Text>
          <Text style={styles.noResultsSubtext}>
            Join some leagues to see them here!
          </Text>
        </View>
      ) : (
        myLeagues.map(league => (
          <View key={league.id} style={styles.leagueCard}>
            <View style={styles.leagueHeader}>
              <Text style={styles.leagueName}>{league.name}</Text>
              <View style={[styles.rankBadge, { backgroundColor: getRankColor(league.userStats.rank) }]}>
                <Text style={styles.rankText}>#{league.userStats.rank}</Text>
              </View>
            </View>
            
            <Text style={styles.leagueInfo}>🏆 Sport: {league.sport}</Text>
            <Text style={styles.leagueInfo}>📍 Location: {league.location}</Text>
            <Text style={styles.leagueDescription}>{league.description}</Text>

            {/* Stats Section */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>ELO Rating</Text>
                <Text style={[styles.statValue, { color: getEloColor(league.userStats.elo) }]}>
                  {league.userStats.elo}
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Win Rate</Text>
                <Text style={styles.statValue}>
                  {getWinRate(league.userStats.wins, league.userStats.losses, league.userStats.ties)}%
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Games</Text>
                <Text style={styles.statValue}>{league.userStats.gamesPlayed}</Text>
              </View>
            </View>

            {/* W-T-L Record */}
            <View style={styles.recordContainer}>
              <View style={styles.recordItem}>
                <Text style={styles.recordNumber}>{league.userStats.wins}</Text>
                <Text style={styles.recordLabel}>Wins</Text>
              </View>
              <View style={styles.recordSeparator} />
              <View style={styles.recordItem}>
                <Text style={styles.recordNumber}>{league.userStats.ties}</Text>
                <Text style={styles.recordLabel}>Ties</Text>
              </View>
              <View style={styles.recordSeparator} />
              <View style={styles.recordItem}>
                <Text style={styles.recordNumber}>{league.userStats.losses}</Text>
                <Text style={styles.recordLabel}>Losses</Text>
              </View>
            </View>

            {/* Log Game Button */}
            <TouchableOpacity 
              style={styles.logGameButton}
              onPress={() => handleLogGame(league.id, league.name)}
            >
              <Text style={styles.logGameButtonText}>📊 Log Game</Text>
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.viewButton}>
                <Text style={styles.viewButtonText}>Match History</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.viewButton}>
                <Text style={styles.viewButtonText}>Leaderboard</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.leaveButton}
                onPress={() => handleLeaveLeague(league.id, league.name)}
              >
                <Text style={styles.leaveButtonText}>Leave League</Text>
              </TouchableOpacity>
            </View>
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
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
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
    textAlign: 'center',
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
  leagueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  leagueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f95dc',
    flex: 1,
  },
  rankBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 10,
  },
  rankText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 15,
    paddingVertical: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f95dc',
    marginTop: 4,
  },
  recordContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
    paddingVertical: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  recordItem: {
    alignItems: 'center',
    flex: 1,
  },
  recordNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2f95dc',
  },
  recordLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  recordSeparator: {
    width: 1,
    height: 40,
    backgroundColor: '#ddd',
    marginHorizontal: 10,
  },
  logGameButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    marginVertical: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  logGameButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  viewButton: {
    backgroundColor: '#2f95dc',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  viewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  leaveButton: {
    backgroundColor: '#f44336',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
  },
  leaveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});