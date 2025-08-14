import React, { useState, useEffect } from 'react';
import { Platform, View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, TextInput, FlatList  } from 'react-native';
import { createLeague, getUserLeagues, leaveLeague, createNotification, createMatch, getAllMatches, getAllMatchesStruct } from '../../services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';

export default function MyLeagues() {
  const [myLeagues, setMyLeagues] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [curLeague, setCurLeague] = useState(null);
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
    password: "",
  });
  const expiryImplemented = false;
  const privateImplemented = true;
  // Log & Search
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const players = curLeague ? Object.entries(curLeague.elo_info) : [];
  const filteredPlayers = players.filter(
    ([id, info]) => 
    `${info.first_name} ${info.last_name}`.toLowerCase().includes(search.toLowerCase()) 
  );
  const [winTeam, setWinTeam] = useState([]);
  const [lossTeam, setLossTeam] = useState([]);
  // Notifs
  const [messageHeader, setMessageHeader] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [showNotifModal, setShowNotifModal] = useState(false);
  // Match History
  const [matchHistory, setMatchHistory] = useState([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [allMatches, setAllMatches] = useState({});

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

    fetchAllMatchHistory();
    fetchMyLeagues();
  }, [user?.uid]);

  const handleRefresh = async () => {
    try {
      const leagues = await getUserLeagues(user?.uid);
      setMyLeagues(leagues);
      fetchAllMatchHistory();
    } catch (error) {
      console.error('Error fetching my leagues:', error);
    }
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
      if (!proceed) return;
      await leaveLeague(leagueId, user?.uid);
      handleRefresh();

    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert(`'Error', 'Failed to leave league. Please try again.' ${error.message}`);
      } else {
        Alert.alert('Error', `Failed to leave league. Please try again. ${error.message}`);
      }
    }
  };

  // Small Helpers FXNs
  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700'; 
    if (rank === 2) return '#C0C0C0'; 
    if (rank === 3) return '#CD7F32';
    if (rank <= 5) return '#934a26ff';
    if (rank <= 10) return '#5c4336ff';
    return '#2b2b2bff'; // Default
  };

  const getEloColor = (elo) => {
    if (elo >= 1400) return '#32f04eff';
    if (elo >= 1200) return '#af7febff';
    if (elo >= 1000) return '#45f6e7ff';
    if (elo >= 900) return '#3b99e6ff'; 
    if (elo >= 700) return '#8f9b6cff'; 
    return '#666';
  };

  const getWinRate = (wins, losses, ties) => {
    const total = wins + losses + ties;
    if (total === 0) return 0;
    return ((wins + ties * 0.5) / total * 100).toFixed(1);
  };

  // Header Displays
  const header = (
    <View style={styles.header}>
      <Text style={styles.title}>My Leagues</Text>
      <Text style={styles.subtitle}>Track your performance and rankings</Text>
    </View>
  );

  const resultsCount = (
    <View style={styles.resultsContainer}>
      <TouchableOpacity onPress={handleRefresh} >
        <Text style={[styles.refreshButtonText]}>🔄</Text>
      </TouchableOpacity>

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

  // LEADERBOARD FXNS
  const lbPressed = (league) => {
    setCurLeague(league);
    setShowLeaderboardModal(true);
  };

  const getSortedLeaderboard = () => {
    if (!curLeague) return [];
    const out = Object.entries(curLeague.elo_info).sort((a, b) => b[1].elo - a[1].elo);
    return out;
  };

  const leaderboardMap = (curLeague) ? (getSortedLeaderboard()).map(([pId, pInfo], i) => {
    const name = pInfo.first_name + " " + pInfo.last_name;
    const rank = i + 1;
    const elo = pInfo.elo;
    return (
      <View key={pId} style={[styles.row, {backgroundColor: (i % 2 === 0) ? '#f9f9f9' : '#ffffff'}]}>
        <Text style={[styles.rank, { color: getRankColor(rank || 10) }]} >{rank}</Text>
        <Text style={[styles.name]}>{name}</Text>
        <Text style={[styles.elo, { color: getEloColor(elo || 0) }]}>{elo}    </Text>
      </View>
    );
  }) : null;

  const leaderboardModal = (
    <Modal
        visible={showLeaderboardModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLeaderboardModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Leaderboard</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowLeaderboardModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {leaderboardMap}
          </ScrollView>

        </View>
      </Modal>
  );

  // NOTIFICATION FXNS
  const notifClicked = async (league) => {
    setCurLeague(league);
    setShowNotifModal(true);
  };

  const notifUnclicked = async () => {
    setShowNotifModal(false);
    setMessageBody("");
    setMessageHeader("");
  };

  const handleCreateNotif = async () => {
    try {
      await createNotification({
        admin_name: `${userInfo.first_name} ${userInfo.last_name}`,
        league_name: curLeague.league_name,
        players: curLeague.players,
        header: messageHeader,
        body: messageBody,
        timestamp: new Date(),
      });
      if (Platform.OS === 'web') {
        window.alert("Notification Sent!");
      } else {
        Alert.alert('Success', 'Notification Sent!');
      }
      notifUnclicked();
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert("Notification Creation Failed.");
      } else {
        Alert.alert('Error', 'Notification Creation Failed.');
      }
    }
  }

  const notificationModal = (
    <Modal
      visible={showNotifModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => notifUnclicked()}
    >
      <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Send Notification</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => notifUnclicked()}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* League Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Message Subject *</Text>
              <TextInput
                style={styles.textInput}
                value={messageHeader}
                onChangeText={(text) => setMessageHeader(text)}
                placeholder="Enter message subject"
                maxLength={50}
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Message Body *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={messageBody}
                onChangeText={(text) => setMessageBody(text)}
                placeholder="Message body"
                multiline
                numberOfLines={5}
                maxLength={500}
              />
            </View>

          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => notifUnclicked()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => handleCreateNotif()}
            >
              <Text style={styles.createButtonText}>Send Notification</Text>
            </TouchableOpacity>
          </View>
        </View>
    </Modal>
  );

  // CREATING A LEAGUE
  const handleCreateLeague = async () => {
    // Validate required fields
    if (!newLeague.league_name.trim()) {
      if (Platform.OS === 'web') {
        window.alert(`'Error', 'Please enter a league name.'`);
      } else {
        Alert.alert('Error', 'Please enter a league name.');
      }
      return;
    }
    if (!newLeague.password.trim() && (!newLeague.is_public)) {
      if (Platform.OS === 'web') {
        window.alert(`'Error', 'Please enter a league password.'`);
      } else {
        Alert.alert('Error', 'Please enter a league password.');
      }
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
        password: ""
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
            {privateImplemented && (<View style={styles.inputGroup}>
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
                  <Text style={styles.privacyOptionSubtext}>Visible, Password required to join</Text>
                </TouchableOpacity>
              </View>
            </View>)}

            {/* Password */}
            {newLeague.isPublic === false && (<View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newLeague.password}
                onChangeText={(text) => setNewLeague({...newLeague, password: text})}
                placeholder="Enter a short password for the league"
                multiline
                numberOfLines={1}
                maxLength={15}
              />
            </View>)}

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

  // LOG FXNS
  const logPressed = (league) => {
    setCurLeague(league);
    setShowLogModal(true);
  };
  
  const handleLogGamePressed = async () => {
    // Is User in the Game
    const userPresent = winTeam.includes(user?.uid) || lossTeam.includes(user?.uid);
    if (!userPresent) {
      if (Platform.OS === 'web') {
        window.alert("You must be a player in the league to log a game.");
      } else {
        Alert.alert("Error", "You must be a player in the league to log a game.");
      }
      return;
    }
    const validTeams = winTeam.length === lossTeam.length;
    if (!validTeams) {
      if (Platform.OS === 'web') {
        window.alert("Both teams must have the same number of players.");
      } else {
        Alert.alert("Error", "Both teams must have the same number of players.");
      }
      return;
    }
    if (!curLeague.league_id) {
      if (Platform.OS === 'web') {
        window.alert("League Error");
      } else {
        Alert.alert("Error", "League Error");
      }
      return;
    }

    // Continue
    const winTeamInfo = getPlayerInfoArray(winTeam);
    const winTeamClean = Object.fromEntries(winTeamInfo);

    const lossTeamInfo = getPlayerInfoArray(lossTeam);
    const lossTeamClean = Object.fromEntries(lossTeamInfo);

    const matchData = {
      league_id: curLeague.league_id,
      league_k_factor: curLeague.league_k_factor,
      win_team: winTeamClean,
      loss_team: lossTeamClean,
      timestamp: new Date(),
    };

    const result = await createMatch(matchData);
    if (!result) {
      if (Platform.OS === 'web') {
        window.alert("Failed to create match.");
      } else {
        Alert.alert("Error", "Failed to create match.");
      }
    }
    if (result) {
      if (Platform.OS === 'web') {
        window.alert("Match created successfully.");
      } else {
        Alert.alert("Success", "Match created successfully.");
      }
      setWinTeam([]);
      setLossTeam([]);
      setShowLogModal(false);
    }
  };

  const toggleWin = (id) => {
    setSearch('');
    setWinTeam(prev => {
      if (prev.includes(id)) return prev;
      setLossTeam(lossPrev => lossPrev.filter(pid => pid !== id));
      return [...prev, id];
    });
  };

  const toggleLoss = (id) => {
    setSearch('');
    setLossTeam(prev => {
      if (prev.includes(id)) return prev;
      setWinTeam(winPrev => winPrev.filter(pid => pid !== id));
      return [...prev, id];
    });
  };

  const toggleClear = (id) => {
    setSearch('');
    setWinTeam(prev => prev.filter(pid => pid !== id));
    setLossTeam(prev => prev.filter(pid => pid !== id));
  };

  const getPlayerNames = (team) => {
    if (!curLeague || !curLeague.elo_info) return [];
    return team.map(
      pid => {
        const info = curLeague.elo_info[pid];
        if (!info) return null;
        return `${info.first_name} ${info.last_name}`;
      })
      .filter(Boolean);
  };

  const getPlayerInfoArray = (team) => {
    if (!curLeague || !curLeague.elo_info) return [];
    return team.map(
      pid => {
        const info = curLeague.elo_info[pid];
        if (!info) return null;
        const pidInfo = {
          first_name: info.first_name,
          last_name: info.last_name,
          elo: info.elo
        }
        return [pid, pidInfo];
      })
      .filter(Boolean);
  };

  const clearModal = () => {
    setSearch('');
    setWinTeam([]);
    setLossTeam([]);
  };

  const logModal = (
    <Modal
        visible={showLogModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {setShowLogModal(false); clearModal();} }
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log Game</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => {setShowLogModal(false); clearModal();}}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            <View style={styles_col.modalContentContainer}>
              <View style={styles_col.leftColumn}>
                {/* Search Bar */}
                <TextInput
                  style={[styles.searchBar, {color: '#666666'}]}
                  placeholder="Search players..."
                  value={search}
                  onChangeText={setSearch}
                />

                {/* Player List */}
                <FlatList
                data={filteredPlayers}
                keyExtractor={([id]) => id}
                renderItem={({ item: [id, info] }) => {
                  const name = `${info.first_name} ${info.last_name}`;
                  const isWin = winTeam.includes(id);
                  const isLoss = lossTeam.includes(id);

                  return (
                    <View style={styles.playerRow}>
                      <View style={styles.nameCol}>
                        <Text style={styles.nameText}>{name}</Text>
                        <Text style={styles.eloText}>{info.elo}{isLoss && ' (L)'}{isWin && ' (W)'}</Text>
                      </View>

                      <TouchableOpacity
                        style={[styles.clearCol]}
                        onPress={() => toggleClear(id)}
                      >
                        <Text style={styles.teamText}>C</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.winCol, isWin && styles.selectedWin]}
                        onPress={() => toggleWin(id)}
                      >
                        <Text style={styles.teamText}>W</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.lossCol, isLoss && styles.selectedLoss]}
                        onPress={() => toggleLoss(id)}
                      >
                        <Text style={styles.teamText}>L</Text>
                      </TouchableOpacity>

                      
                    </View>
                  );
                }}
              />
              </View>
              <View style={styles_col.rightColumn}>
                <View style={styles_col.winArea}>
                  <Text style={styles_col.teamLabel}>Won</Text>
                  <View style={styles_col.teamPlayers}>
                    <Text style={styles_col.teamPlayersText}>{getPlayerNames(winTeam).join('\n')}</Text>
                  </View>
                </View>
              </View>

              <View style={styles_col.rightColumn}>
                <View style={styles_col.lossArea}>
                  <Text style={styles_col.teamLabel}>Lost</Text>
                  <View style={styles_col.teamPlayers}>
                    <Text style={styles_col.teamPlayersText}>{getPlayerNames(lossTeam).join('\n')}</Text>
                  </View>
                </View>
              </View>
              
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => {setShowLogModal(false); clearModal();}}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => handleLogGamePressed()}
            >
              <Text style={styles.createButtonText}>Log Game</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
  );

  // Match FXNs
  const matchPressed = (league) => {
    setCurLeague(league);
    setShowMatchModal(true);
  };

  const fetchAllMatchHistory = async () => {
    try {
      const matches = await getAllMatches();
      setMatchHistory(matches);
    } catch (error) {
    }
  };

  const getMatchPlayers = (team) => {
    const playerNames = Object.values(team).map(
      ({first_name, last_name}) => `${first_name} ${last_name}`
    );
    return playerNames;
  };
  
  const matchMap = (matchHistory.length > 0 && curLeague) ? ((matchHistory).map(matchInfo => {
    if (matchInfo?.league_id !== curLeague?.league_id) { return null; }
    const date = matchInfo.timestamp.toDate().toLocaleDateString().slice(0,-5);
    return (
      <View key={matchInfo.id} style={[styles_match.matchContainer]}>
        
        <View style={[styles_match.card, styles_match.winnerCard]}>
          <Text style={styles_match.names}>{getMatchPlayers(matchInfo.win_team).join(", ")}</Text>
        </View>

        <View style={[styles_match.card, styles_match.loserCard]}>
          <Text style={styles_match.names}>{getMatchPlayers(matchInfo.loss_team).join(", ")}</Text>
        </View>

        <View style={[styles_match.card, styles_match.dateCard]}>
          <Text style={styles_match.names}>{date}</Text>
        </View>

      </View>
    );
  })) : null;

  const matchHistoryModal = (
    <Modal
        visible={showMatchModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMatchModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Match History</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowMatchModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {matchMap}
          </ScrollView>

        </View>
      </Modal>
  );
  

  // LEAGUE CARDS
  const leagueCards = myLeagues.map(league => { 
    const stats = league?.elo_info[user?.uid];
    const numGames = (stats?.wins || 0) + (stats?.losses || 0) + (stats?.ties || 0);
    const LID = league.league_id;
    const leagueExpDate = league.league_end_date;
    const leagueDidExpire = ((leagueExpDate) && leagueExpDate < Date.now()) && expiryImplemented;

    return (
    <View key={LID} style={[styles.leagueCard, leagueDidExpire && styles.leagueCardExpired]}>
      <View style={styles.leagueHeader}>
        <Text style={styles.leagueName}>{league.league_name}</Text>
        {(user?.uid == league?.admin_pid && expiryImplemented) && (<TouchableOpacity style={styles.leagueEnd} onPress={() => {}}>
          <Text style={styles.leagueEndText}>📅</Text>
        </TouchableOpacity>)}
      </View>
      
      <Text style={styles.leagueInfo}>{(league.location) ? ("📍 " + league.location) : "" }</Text>
      <Text style={styles.leagueDescription}>{(league.description) ? league.description : ""}</Text>

      {/* Stats Section */}
      <View style={[styles.statsContainer, leagueDidExpire && styles.statsContainerExpired]}>
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
      <View style={[styles.recordContainer, leagueDidExpire && styles.recordContainerExpired]}>
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
      {(!leagueDidExpire) && (<TouchableOpacity 
        style={styles.logGameButton}
        onPress={() => logPressed(league)}
      >
        <Text style={styles.logGameButtonText}>📊 Log Game</Text>
      </TouchableOpacity>)}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.viewButton} onPress={() => matchPressed(league)}>
          <Text style={styles.viewButtonText}>Match History</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.viewButton} onPress={() => lbPressed(league)}>
          <Text style={styles.viewButtonText}>Leaderboard</Text>
        </TouchableOpacity>
        
        { user?.uid === league?.admin_pid ? 
        (<TouchableOpacity 
          style={styles.notifButton}
          onPress={() => notifClicked(league)}
        >
          <Text style={styles.leaveButtonText}>Send Notification</Text>
        </TouchableOpacity>) 
        :
        (<TouchableOpacity 
          style={styles.leaveButton}
          onPress={() => handleLeaveLeague(LID, league.league_name)}
        >
          <Text style={styles.leaveButtonText}>Leave League</Text>
        </TouchableOpacity>)
        }
      </View>
    </View>
    )
  });

  return (
    <ScrollView style={styles.container}>
      {header}
      {resultsCount}
      {myLeagues.length === 0 ? ( noLeagues ) : ( leagueCards ) }

      {createLeagueModal}
      {leaderboardModal}
      {logModal}
      {notificationModal}
      {matchHistoryModal}

      <TouchableOpacity 
        style={styles.createLeagueButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Text style={styles.createLeagueButtonText}>➕ Create New League</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles_col = StyleSheet.create({
  modalContentContainer: {
  flex: 1,
  flexDirection: 'row',
  },
  leftColumn: {
    flex: 1, 
    borderRightWidth: 2,
    borderRightColor: '#ccc',
  },
  rightColumn: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  teamHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  teamHeaderWin: {
    flex: 1,
    backgroundColor: '#d6f5d6',
    padding: 8,
    alignItems: 'center',
  },
  teamHeaderLoss: {
    flex: 1,
    backgroundColor: '#f5d6d6',
    padding: 8,
    alignItems: 'center',
  },
  teamLabel: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  teamPlayersRow: {
    flex: 1,
    flexDirection: 'row',
  },
  teamPlayers: {
    flex: 1,
    padding: 8,
  },
  teamPlayersText: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  winArea: {
    flex: 1,
    backgroundColor: '#d6f5d6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lossArea: {
    flex: 1,
    backgroundColor: '#f5d6d6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const styles = StyleSheet.create({
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  nameCol: {
    flex: 2,
    padding: 8,
    justifyContent: 'center',
  },
  nameText: {
    fontSize: 16,
  },
  eloText: {
    fontSize: 12,
    color: '#666',
  },
  winCol: {
    flex: 1,
    backgroundColor: '#d6f5d6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  lossCol: {
    flex: 1,
    backgroundColor: '#f5d6d6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  clearCol: {
    flex: 1,
    backgroundColor: '#cdcdcdff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  selectedWin: {
    backgroundColor: '#98e698',
    borderWidth: 2,
    borderColor: 'black',
  },
  selectedLoss: {
    backgroundColor: '#e69898',
    borderWidth: 2,
    borderColor: 'black',
  },
  teamText: {
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  rank: {
    width: 40,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  name: {
    flex: 1, 
    paddingHorizontal: 8,
  },
  elo: {
    width: 60,
    textAlign: 'right',
    fontWeight: '600',
  },
  refreshButtonText:{
    fontSize: 32,
  },
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
  leagueCardExpired: {
    backgroundColor: '#d4d4d4ff',
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
  leagueEnd: {
    backgroundColor: '#444',
    padding: 10,
    borderRadius: 10,
    fontSize: 26,
    color: '#666',
    justifyContent: 'center',
  },
  leagueEndText: {
    fontSize: 18,
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
  statsContainerExpired: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 15,
    paddingVertical: 15,
    backgroundColor: '#dfdfdfff',
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
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  recordContainerExpired: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
    paddingVertical: 15,
    backgroundColor: '#dfdfdfff',
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
  notifButton: {
    backgroundColor: '#8536f4ff',
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
  modalNotifContainer: {
    flex: 1,
    backgroundColor: 'white',
    flexDirection: 'column',
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
  searchBar: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    margin: 10,
  },
  selectedRow: {
    backgroundColor: '#d0f0d0', // light green for selected
  },
});

const styles_match = StyleSheet.create({
  matchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  winnerCard: {
    flex: 4,
    backgroundColor: '#72cd75ff', 
  },
  loserCard: {
    flex: 4,
    backgroundColor: '#ed6a60ff',
  },
  dateCard: {
    flex: 1,
    backgroundColor: '#a8a8a8ff',
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  names: {
    fontSize: 14,
    color: 'white',
  },
});