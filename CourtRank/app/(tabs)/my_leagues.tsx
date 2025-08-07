import React, { useState, useEffect } from 'react';
import { Platform, View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, TextInput  } from 'react-native';
import { createLeague, getUserLeagues, leaveLeague } from '../../services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';

export default function MyLeagues() {
  const [myLeagues, setMyLeagues] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user, userInfo, isLoading } = useAuth();
  const [newLeague, setNewLeague] = useState({
    admin_pid: user?.uid,
    league_k_factor: 40,
    is_public: true,
    league_end_date: null,
    league_name: `${userInfo?.first_name}'s League`,
    starting_elo: 800,
    created_at: new Date(),
    matches: [],
    league_id: null,
    elo_array: [],
    whitelist_pids: [],
    players: [],
    description: "",
  });
  

  const handleLogGame = async (leagueId, leagueName) => {
    return; // TODO
  };

  const handleLeaveLeague = async (leagueId, leagueName) => {
    try {
      var proceed = false;
      if (Platform.OS === 'web') {
        proceed = window.confirm(`Leave ${leagueName}?`);
      } else {
        Alert.alert(
          'Leave League',
          `Are you sure you want to leave "${leagueName}"?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Leave', 
              style: 'destructive',
              onPress: async () => {
                proceed = true;
              }
            }
          ]
        );
      }
      // TODO: Act leave league if proceed is true
      if (!proceed) return;
      await leaveLeague(leagueId, user?.uid);

    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert(`'Error', 'Failed to leave league. Please try again.' ${error.message}`);
      } else {
        Alert.alert('Error', `Failed to leave league. Please try again. ${error.message}`);
      }
    }
  };

  const handleCreateLeague = async () => {
    // Validate required fields
    if (!newLeague.league_name.trim()) {
      Alert.alert('Error', 'Please enter a league name.');
      return;
    }

    try {
      await createLeague(newLeague);
      
      setShowCreateModal(false);
      
      // Reset form
      setNewLeague({
        admin_pid: user?.uid,
        league_k_factor: 40,
        is_public: true,
        league_end_date: null,
        league_name: `${userInfo?.first_name}'s League`,
        starting_elo: 800,
        created_at: new Date(),
        matches: [],
        league_id: null,
        elo_array: [],
        whitelist_pids: [],
        players: [],
        description: "",
      });

      // Show success notification
      if (Platform.OS === 'web') {
        window.alert(`"${newLeague.league_name}" has been created successfully. You are now the league administrator.`);
      } else {
        Alert.alert(
          'League Created! 🎉',
          `"${newLeague.league_name}" has been created successfully. You are now the league administrator.`,
          [
            { 
              text: 'Great!', 
              style: 'default'
            }
          ]
        );
        }
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert(`'Error', 'Failed to create league. Please try again.'`);
      } else {
        Alert.alert('Error', 'Failed to create league. Please try again.');
      }
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

  useEffect(() => {
    // Fetch user's leagues from backend
    const fetchMyLeagues = async () => {
      try {
        const leagues = await getUserLeagues(user?.uid);
        setMyLeagues(leagues);
      } catch (error) {
        console.error('Error fetching my leagues:', error);
      }
    };

    fetchMyLeagues();
  }, [user?.uid]);

  const header = (
    <View style={styles.header}>
      <Text style={styles.title}>My Leagues</Text>
      <Text style={styles.subtitle}>Track your performance and rankings</Text>
    </View>
  );

  const resultsCount = (
    <View style={styles.resultsContainer}>
      <Text style={styles.resultsText}>
        {myLeagues.length} league{myLeagues.length !== 1 ? 's' : ''} joined
      </Text>
    </View>
  );

  const noLeagues = (
    <View style={styles.noResultsContainer}>
      <Text style={styles.noResultsText}>No leagues found</Text>
      <Text style={styles.noResultsSubtext}>
        Join some leagues to see them here!
      </Text>
    </View>
  );

  const leagueCards = myLeagues.map(league => { 
    const stats = league?.elo_info[user?.uid];
    const numGames = (stats?.wins || 0) + (stats?.losses || 0) + (stats?.ties || 0);
    return (
    <View key={league.id} style={styles.leagueCard}>
      <View style={styles.leagueHeader}>
        <Text style={styles.leagueName}>{league.league_name}</Text>
        {/* <View style={[styles.rankBadge, { backgroundColor: getRankColor(league.userStats.rank) }]}>
          <Text style={styles.rankText}>#{league.userStats.rank}</Text>
        </View> */}
      </View>
      
      {/* <Text style={styles.leagueInfo}>🏆 Sport: {league.sport}</Text> */}
      <Text style={styles.leagueInfo}>{(league.location) ? ("📍 Location: " + league.location) : "" }</Text>
      <Text style={styles.leagueDescription}>{(league.description) ? league.description : ""}</Text>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>ELO Rating</Text>
          <Text style={[styles.statValue, { color: getEloColor(stats?.elo || 0) }]}>
            {stats?.elo || ""}
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Win Rate</Text>
          <Text style={styles.statValue}>
            {(numGames === 0) ? "--" : getWinRate(stats?.wins || 0, stats?.losses || 0, stats?.ties || 0)}%
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Games</Text>
          <Text style={styles.statValue}>{numGames}</Text>
        </View>
      </View>

      {/* W-T-L Record */}
      <View style={styles.recordContainer}>
        <View style={styles.recordItem}>
           <Text style={styles.recordNumber}>{stats.wins ?? 0}</Text>
          <Text style={styles.recordLabel}>Wins</Text>
        </View>
        <View style={styles.recordSeparator} />
        <View style={styles.recordItem}>
           <Text style={styles.recordNumber}>{stats.ties ?? 0}</Text>
          <Text style={styles.recordLabel}>Ties</Text>
        </View>
        <View style={styles.recordSeparator} />
        <View style={styles.recordItem}>
           <Text style={styles.recordNumber}>{stats.losses ?? 0}</Text>
          <Text style={styles.recordLabel}>Losses</Text>
        </View>
      </View>

      {/* Log Game Button */}
      <TouchableOpacity 
        style={styles.logGameButton}
        onPress={() => handleLogGame(league.id, league.league_name)}
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
          onPress={() => handleLeaveLeague(league.id, league.league_name)}
        >
          <Text style={styles.leaveButtonText}>Leave League</Text>
        </TouchableOpacity>
      </View>
    </View>
    )
  });

  const createLeagueModal = (
    <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New League</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* League Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>League Name *</Text>
              <TextInput
                style={styles.textInput}
                value={newLeague.league_name}
                onChangeText={(text) => setNewLeague({...newLeague, league_name: text})}
                placeholder="Enter league name"
                maxLength={50}
              />
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.textInput}
                value={newLeague.location}
                onChangeText={(text) => setNewLeague({...newLeague, location: text})}
                placeholder="Example: UIUC Tennis Courts (optional)"
                maxLength={100}
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newLeague.description}
                onChangeText={(text) => setNewLeague({...newLeague, description: text})}
                placeholder="Enter a short league description (optional)"
                multiline
                numberOfLines={1}
                maxLength={100}
              />
            </View>

            {/* Privacy Setting */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>League Privacy *</Text>
              <View style={styles.privacyOptions}>
                <TouchableOpacity
                  style={[
                    styles.privacyOption,
                    newLeague.isPublic && styles.privacyOptionSelected
                  ]}
                  onPress={() => setNewLeague({...newLeague, isPublic: true})}
                >
                  <Text style={[
                    styles.privacyOptionText,
                    newLeague.isPublic && styles.privacyOptionTextSelected
                  ]}>
                    🌐 Public
                  </Text>
                  <Text style={styles.privacyOptionSubtext}>Anyone can find and join</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.privacyOption,
                    !newLeague.isPublic && styles.privacyOptionSelected
                  ]}
                  onPress={() => setNewLeague({...newLeague, isPublic: false})}
                >
                  <Text style={[
                    styles.privacyOptionText,
                    !newLeague.isPublic && styles.privacyOptionTextSelected
                  ]}>
                    🔒 Private
                  </Text>
                  <Text style={styles.privacyOptionSubtext}>Visible, but Invite required to join</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.createButton}
              onPress={handleCreateLeague}
            >
              <Text style={styles.createButtonText}>Create League</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
  );

  return (
    <ScrollView style={styles.container}>
      {header}
      {resultsCount}
      {myLeagues.length === 0 ? ( noLeagues ) : ( leagueCards ) }

      {createLeagueModal}

      <TouchableOpacity 
        style={styles.createLeagueButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Text style={styles.createLeagueButtonText}>➕ Create New League</Text>
      </TouchableOpacity>

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
  createLeagueButton: {
    backgroundColor: '#4CAF50',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  createLeagueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
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
  // Modal Styles
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
    backgroundColor: '#2f95dc',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
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
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  sportSelector: {
    flexDirection: 'row',
  },
  sportOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sportOptionSelected: {
    backgroundColor: '#2f95dc',
    borderColor: '#2f95dc',
  },
  sportOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  sportOptionTextSelected: {
    color: 'white',
  },
  privacyOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  privacyOption: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  privacyOptionSelected: {
    borderColor: '#2f95dc',
    backgroundColor: '#e3f2fd',
  },
  privacyOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  privacyOptionTextSelected: {
    color: '#2f95dc',
  },
  privacyOptionSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
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
  createButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    marginLeft: 10,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});