import React, { useState, useEffect } from 'react';
import { RefreshControl, Platform, View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, TextInput, FlatList, Linking, Dimensions, useWindowDimensions } from 'react-native';
import { createLeague, getUserLeagues, leaveLeague, createNotification, createMatch, getAllMatches, updateLeagueEndDate, updateLeagueInfo } from '../../services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';
import * as Device from 'expo-device';
import { osName } from 'expo-device';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Calendar, Flag, RotateCcw, Pencil } from 'lucide-react-native';
import { myPrint, checkIsProfanityAndAlert, confirmAction } from '../helpers';

// Rollback
import { getFunctions, httpsCallable } from 'firebase/functions';
const functions = getFunctions();
const rollbackMatch = httpsCallable(functions, 'rollback_match');
const handleRollback = async (matchId: string): Promise<boolean> => {
  try {
    await rollbackMatch({ match_id: matchId });
    myPrint('Match rolled back successfully');
    return true;
  } catch (error: any) {
    myPrint(error.message || 'Failed to rollback match', 'Rollback Failed');
    return false;
  }
};





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
    archived: false,
  });
  const expiryImplemented = true;
  const privateImplemented = true;
  // Log & Search
  const [search, setSearch] = useState('');
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
  // Report
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportPlayer, setReportPlayer] = useState(null);
  const [playerNotLeague, setPlayerNotLeague] = useState(false);
  // Match History
  const [matchHistory, setMatchHistory] = useState([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [loading, setLoading] = useState(false);
  // Admin Settings
  const [showAdminSettingsModal, setShowAdminSettingsModal] = useState(false);
  const [editLeagueName, setEditLeagueName] = useState('');
  const [editLeagueDescription, setEditLeagueDescription] = useState('');
  const [editLeagueLocation, setEditLeagueLocation] = useState('');
  // Leaderboard
  const [eloNotScore, setEloNotScore] = useState(true);

  // Screen width - for responsive layout
  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 520;


  useEffect(() => {
    // Fetch user's leagues from backend
    setLoading(true);
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
    setLoading(false);
  }, [user?.uid]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const leagues = await getUserLeagues(user?.uid);
      setMyLeagues(leagues);
      fetchAllMatchHistory();
    } catch (error) {
      myPrint('Error fetching my leagues:', "Error");
    }
    setLoading(false);
  };

  const handleLeaveLeague = async (leagueId, leagueName) => {
    try {
      if (Platform.OS === 'web') {
        const proceed = window.confirm(`Leave ${leagueName}?`);
        if (!proceed) return;
        await leaveLeague(leagueId, user?.uid);
        handleRefresh();
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
                try {
                  await leaveLeague(leagueId, user?.uid);
                  handleRefresh();
                } catch (error) {
                  console.error('Error leaving league:', error);
                }
              }
            }
          ]
        );
      }

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
    if (elo >= 1050) return '#9732f0ff';
    if (elo >= 1000) return '#324bf0ff';
    if (elo >= 950) return '#32b4f0ff';
    if (elo >= 900) return '#6ed694ff';
    if (elo >= 850) return '#9dce42ff';
    if (elo >= 800) return '#d7e054ff'; 
    if (elo >= 750) return '#dfb93fff'; 
    if (elo >= 700) return '#8b783aff'; 
    return '#666';
  };

  const getScoreColor = (score) => {
    if (score >= 4000) return '#e84a4aff';
    if (score >= 3800) return '#a550b2ff';
    if (score >= 3400) return '#5e32f0ff';
    if (score >= 3000) return '#32b4f0ff';
    if (score >= 2400) return '#6ed694ff';
    if (score >= 1800) return '#9dce42ff';
    if (score >= 1200) return '#d7e054ff'; 
    if (score >= 800) return '#dfb93fff'; 
    if (score >= 400) return '#8b783aff'; 
    return '#666';
  };

  const getWinRate = (wins, losses, ties) => {
    const total = wins + losses + ties;
    if (total === 0) return 0;
    return (((wins + ties * 0.5) / total) * 100).toFixed(1);
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
        <Text style={[styles.refreshButtonText]}>↺ </Text>
      </TouchableOpacity>

      {!loading ? 
      (<Text style={styles.resultsText}>
        {myLeagues.length} league{myLeagues.length !== 1 ? 's' : ''} joined
      </Text>)
      : 
      ( <Text style={styles.resultsText}>
        loading...
      </Text>)
      }
      
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
    const updatedLeague = {
      ...league,
      elo_info: Object.fromEntries(
        Object.entries(league.elo_info).map(([playerId, player]) => [
          playerId,
          {
            ...player,
            score: calculateScore(player),
          },
        ])
      ),
    };
    setCurLeague(updatedLeague);
    setShowLeaderboardModal(true);
  };

  const getSortedLeaderboardElo = () => {
    if (!curLeague) return [];
    const out = Object.entries(curLeague.elo_info).sort((a, b) => {
      if (b[1].elo !== a[1].elo) {
        return b[1].elo - a[1].elo;
      }
      
      return a[1].last_name.localeCompare(b[1].last_name);
    });
    return out;
  };

  const calculateScore = (playerObj) => {
    const totalGames = playerObj.wins + playerObj.losses;
    if (totalGames == 0) {
      return 0;
    }
    const winRate = totalGames > 0 ? (playerObj.wins / totalGames) : 0;
    const constScoreAdj = 500;
    return Math.floor(constScoreAdj * (winRate + 0.5) * Math.log2(totalGames + 1)); // +1 to prevent log2(1)=0
  };

  const getSortedLeaderboardScore = () => {
    if (!curLeague) return [];
    const out = Object.entries(curLeague.elo_info).sort((a, b) => {
      if (b[1].score !== a[1].score) {
        return b[1].score - a[1].score;
      }
      
      return a[1].last_name.localeCompare(b[1].last_name);
    });
    return out;
  };

  const getSortedLeaderboard = () => {
    if (eloNotScore == true) {
      return getSortedLeaderboardElo();
    }
    return getSortedLeaderboardScore();
  }

  const leaderboardMap = (curLeague) ? (getSortedLeaderboard()).map(([pId, pInfo], i) => {
    const name = pInfo.first_name + " " + pInfo.last_name;
    const rank = i + 1;
    const [wins, losses] = [pInfo.wins, pInfo.losses];
    const elo = pInfo.elo;
    const score = pInfo.score || 0;
    const bigScore = score >= 2400;
    var pInfo2 = {...pInfo, pId: pId};
    return (
      <View key={pId} style={[styles.row, {backgroundColor: (i % 2 === 0) ? '#f9f9f9' : '#ffffff'}]}>
        <Text style={[styles.rank, { color: getRankColor(rank || 10) }]}>{rank}</Text>
        <View style={styles.name}>
          <Text style={{ fontWeight: '500' }}>{name} {" "}
            <TouchableOpacity style={styles.flagRed} onPress={() => {setReportPlayer(pInfo2); setPlayerNotLeague(true); reportClicked()}}>
              <Flag size={12} color="#ff0000"/>
            </TouchableOpacity>
          </Text>
        </View>
        <Text style={styles.winLoss}>{wins} / {losses}</Text>
        <Text style={[styles.elo, { color: eloNotScore ? getEloColor(elo || 0) : getScoreColor(score || 0) }]}>
          {eloNotScore ? elo : score}
        </Text>
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

          
          <View style={[styles.row, {backgroundColor: '#d1d1d1ff'}]}>
            <Text style={styles.rank}>Rank</Text>
            <Text style={styles.name}>Name</Text>
            <Text style={styles.winLoss}>W / L</Text>
            <View style={styles.eloHeader}>
              <TouchableOpacity
                style={[styles.togglePillButton, eloNotScore && styles.togglePillActive]}
                onPress={() => setEloNotScore(true)}
              >
                <Text style={[styles.togglePillText, eloNotScore && styles.togglePillTextActive]}>Elo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.togglePillButton, !eloNotScore && styles.togglePillActive]}
                onPress={() => setEloNotScore(false)}
              >
                <Text style={[styles.togglePillText, !eloNotScore && styles.togglePillTextActive]}>Score</Text>
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView>
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

  // REPORT FXNS
  const reportClicked = async () => {
    setShowReportModal(true);
  };

  const reportUnclicked = async () => {
    setShowReportModal(false);
    setMessageBody("");
    setMessageHeader("");
    setReportPlayer(null);
    setPlayerNotLeague(false);
  };

  const handleReportSubmit = async () => {
    const recipient = "courtrankhelp@gmail.com"; // process.env.EXPO_PUBLIC_REPORT_EMAIL || userInfo?.email
    if (!recipient) {
      myPrint('No recipient email configured.', 'Error');
    }

    const offenderLabel = playerNotLeague
      ? "Player: " + ((reportPlayer?.first_name + ' ') || '') + (reportPlayer?.last_name || '') 
        + " | " + reportPlayer?.pId
      : "League: " + (curLeague?.league_name || '_') + " | " + (curLeague?.league_id || '_');

    const reporterName = `${userInfo?.first_name || ''} ${userInfo?.last_name || ''}`.trim() || 'Unknown reporter';
    const reporterEmail = user?.email || 'Unknown email';
    const subject = `CourtRank Report - ${offenderLabel}`;
    const off = "`Offender: ${offenderLabel}`,";
    const body = [
      `Reporter: ${reporterName} (${reporterEmail})`,
      `Offender: ${offenderLabel}`,
      (curLeague?.league_name && playerNotLeague) ? "League: " + (curLeague?.league_name) + " | " + (curLeague?.league_id || '_') : null,
      '',
      'Details:',
      messageBody || '(no message provided)'
    ]
      .filter(Boolean)
      .join('\n');

    const mailtoUrl = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      const supported = await Linking.canOpenURL(mailtoUrl);
      if (!supported) {
        if (Platform.OS === 'web') {
          window.alert('Cannot open mail app on this device.');
        } else {
          Alert.alert('Error', 'Cannot open mail app on this device.');
        }
        return;
      }
      await Linking.openURL(mailtoUrl);
    } catch (error) {
      console.error('Error launching email client:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to launch email client.');
      } else {
        Alert.alert('Error', 'Failed to launch email client.');
      }
    }
  };

  const handleCreateNotif = async () => {
    console.log("One ");
    console.log("Header: ", messageHeader);
    console.log("Body: ", messageBody);
    if(checkIsProfanityAndAlert(messageHeader) || checkIsProfanityAndAlert(messageBody)) {
      console.log("Two ");
      return;
    }
    console.log("Three ");
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

    if(checkIsProfanityAndAlert(newLeague.league_name) 
      || checkIsProfanityAndAlert(newLeague.description) 
      || checkIsProfanityAndAlert(newLeague.password)) {
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
        password: "",
        archived: false
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
                    newLeague.is_public && styles.privacyOptionSelected
                  ]}
                  onPress={() => setNewLeague({...newLeague, is_public: true})}
                >
                  <Text style={[
                    styles.privacyOptionText,
                    newLeague.is_public && styles.privacyOptionTextSelected
                  ]}>
                    🌐 Public
                  </Text>
                  <Text style={styles.privacyOptionSubtext}>Anyone can find and join</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.privacyOption,
                    !newLeague.is_public && styles.privacyOptionSelected
                  ]}
                  onPress={() => setNewLeague({...newLeague, is_public: false})}
                >
                  <Text style={[
                    styles.privacyOptionText,
                    !newLeague.is_public && styles.privacyOptionTextSelected
                  ]}>
                    🔒 Private
                  </Text>
                  <Text style={styles.privacyOptionSubtext}>Visible, Password required to join</Text>
                </TouchableOpacity>
              </View>
            </View>)}

            {/* Password */}
            {newLeague.is_public === false && (<View style={styles.inputGroup}>
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
      processed: false,
    };

    const result = await createMatch(matchData);
    if (!result) {
      if (Platform.OS === 'web') {
        window.alert("Failed to create match.");
      } else {
        Alert.alert("Error", "Failed to create match.");
      }
    }
    handleRefresh();
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
      if (prev.includes(id)) return prev.filter(pid => pid !== id);
      setLossTeam(lossPrev => lossPrev.filter(pid => pid !== id));
      return [...prev, id];
    });
  };

  const toggleLoss = (id) => {
    setSearch('');
    setLossTeam(prev => {
      if (prev.includes(id)) return prev.filter(pid => pid !== id);
      setWinTeam(winPrev => winPrev.filter(pid => pid !== id));
      return [...prev, id];
    });
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

         {/* <ScrollView> */}
            <View style={(isSmallScreen) ? styles_col.modalContentContainer : styles_col.modalContentContainerDownwards}>
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
             

              
                <View style={styles_col.lossArea}>
                  <Text style={styles_col.teamLabel}>Lost</Text>
                  <View style={styles_col.teamPlayers}>
                    <Text style={styles_col.teamPlayersText}>{getPlayerNames(lossTeam).join('\n')}</Text>
                  </View>
                </View>
              </View>
              
            </View>
          {/* </ScrollView> */}
          

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
      ({first_name, last_name}) => `${first_name} ${last_name[0]}`
    ).sort((a,b) => b.length - a.length);
    return playerNames;
  };

  const rollBackPressed = async (matchId: string) => {
    if (!matchId) { return; }

    const confirmed = await confirmAction(
      'Are you sure you want to undo this match? ELO ratings will be reverted.',
      'Rollback Match'
    );

    if (confirmed) {
      const success = await handleRollback(matchId);
      if (success) {
        handleRefresh();
      }
    }
  };
  
  const matchMap = (matchHistory.length > 0 && curLeague) ? ((matchHistory).map(matchInfo => {
    if (matchInfo?.league_id !== curLeague?.league_id) { return null; }
    const date = matchInfo.timestamp.toDate().toLocaleDateString().slice(0,-5);
    const playerWon = user?.uid && String(user.uid) in matchInfo.win_team;
    const isProcessed = matchInfo.processed;
    return (
      <View key={matchInfo.id} style={[styles_match.matchContainer, !isProcessed && { opacity: 0.5 }]}>

        
        
          <View style={[styles_match.card, styles_match.winnerCard]}>
            {/* <Text style={styles_match.names}>{getMatchPlayers(matchInfo.win_team).join(", ")}</Text> */}

            {getMatchPlayers(matchInfo.win_team).map((name, index) => (
              <Text key={index} style={[styles_match.names, 
                { fontSize: Math.max(16 - index * 2, 12) }
              ]}>{name}</Text>
            ))}
            
          </View>
        

          <View style={[styles_match.card, styles_match.dateCard]}>
            <Text style={styles_match.matchDate}>{date}</Text>
            <Text style={styles_match.vsText}>vs</Text>

            {(playerWon && (isProcessed)) && (
            <TouchableOpacity onPress={() => rollBackPressed(matchInfo.id)} style={styles_match.rollbackButton}>
              <RotateCcw size={24} color="red" />
            </TouchableOpacity>)
            }

          </View>

          <View style={[styles_match.card, styles_match.loserCard]}>
            {/* <Text style={styles_match.names}>{getMatchPlayers(matchInfo.loss_team).join(", ")}</Text> */}
              {getMatchPlayers(matchInfo.loss_team).map((name, index) => (
              <Text key={index} style={[styles_match.names, 
                { fontSize: Math.max(16 - index * 2, 12) }
              ]}>{name}</Text>
            ))}
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
        <View style={[styles.modalContainer, styles_match.matchModalContainer]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Match History</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowMatchModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          
          <View style={styles.spacing}></View>
            <ScrollView>{matchMap}</ScrollView>

        </View>
      </Modal>
  );
  

  // DATE MODAL
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [savedDate, setSavedDate] = useState('');
  
  
  const handleCancelDate = () => {
    setSelectedDate(savedDate); setShowDateModal(false);
  };
  
  const parseDateFromMMDDYYYY = (dateStr) => {
    if (!dateStr || dateStr.length < 10) return null;
    
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    
    const month = parseInt(parts[0], 10) - 1 ; // -1 for 0 idx
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (day < 1 || day > 31 || month < 0 || month > 11 || year < 2000) return null;
    
    return new Date(year, month, day);
  };

  const formatDateToMMDDYYYY = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const handleSaveDate = async () => {
    if (!selectedDate && !curLeague?.league_end_date) {
      if (Platform.OS === 'web') {
        window.alert('Please select a date or leave blank to remove expiration');
      } else {
        Alert.alert('Error', 'Please select a date or leave blank to remove expiration');
      }
      return;
    }
    
    try {
      let endDate = null;
      
      if (selectedDate) {
        const parsedDate = parseDateFromMMDDYYYY(selectedDate);
        if (!parsedDate) {
          if (Platform.OS === 'web') {
            window.alert('Invalid date format. Please use DD/MM/YYYY');
          } else {
            Alert.alert('Error', 'Invalid date format. Please use DD/MM/YYYY');
          }
          return;
        }
        endDate = parsedDate.getTime();
      }
      
      // Update league end date in Firebase
      const success = await updateLeagueEndDate(curLeague?.league_id, endDate);
      
      if (!success) {
        myPrint('Failed to update league end date', "Error");
      }
      
      setSavedDate(selectedDate);
      setShowDateModal(false);
      
      // Refresh leagues to show updated data
      await handleRefresh();
      
      if (Platform.OS === 'web') {
        window.alert(endDate ? 'League end date set successfully' : 'League end date removed');
      } else {
        Alert.alert('Success', endDate ? 'League end date set successfully' : 'League end date removed');
      }
    } catch (error) {
        myPrint('Error updating league end date:', "Error");
    }
  };
  
  const dateModal = (
    <Modal
        visible={showDateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancelDate}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeaderDate}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Calendar color="white" size={24} style={{ marginRight: 10 }} />
              <Text style={styles.modalTitle}>Set League End Date</Text>
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleCancelDate}
            >
              <X color="white" size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>League End Date *</Text>
              <TextInput
                style={styles.textInput}
                value={selectedDate}
                onChangeText={setSelectedDate}
                placeholder="MM/DD/YYYY (e.g., 08/25/2025)"
                placeholderTextColor="#999"
              />
              <Text style={styles_date.dateHintText}>
                Leave blank for no expiration date
              </Text>
            </View>
            
            {curLeague && (
              <View style={styles_date.leagueInfoBox}>
                <Text style={styles_date.leagueInfoTitle}>Current League:  {curLeague.league_name}</Text>
                {curLeague.league_end_date && (
                  <Text style={styles_date.leagueInfoText}>
                    Current end date: {new Date(curLeague.league_end_date).toLocaleDateString()}
                  </Text>
                )}
              </View>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancelDate}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.createButton}
              onPress={handleSaveDate}
            >
              <Text style={styles.createButtonText}>Save Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
  );

  // ADMIN SETTINGS MODAL
  const adminSettingsClicked = (league) => {
    setCurLeague(league);
    setEditLeagueName(league.league_name || '');
    setEditLeagueDescription(league.description || '');
    setEditLeagueLocation(league.location || '');
    setShowAdminSettingsModal(true);
  };

  const handleCancelAdminSettings = () => {
    setShowAdminSettingsModal(false);
    setEditLeagueName('');
    setEditLeagueDescription('');
    setEditLeagueLocation('');
  };

  const handleSaveAdminSettings = async () => {
    if (!editLeagueName.trim()) {
      myPrint('League name is required', 'Error');
      return;
    }

    if (checkIsProfanityAndAlert(editLeagueName) ||
        checkIsProfanityAndAlert(editLeagueDescription) ||
        checkIsProfanityAndAlert(editLeagueLocation)) {
      return;
    }

    try {
      const success = await updateLeagueInfo(curLeague?.league_id, {
        league_name: editLeagueName.trim(),
        description: editLeagueDescription.trim(),
        location: editLeagueLocation.trim(),
      });

      if (success) {
        if (Platform.OS === 'web') {
          window.alert('League settings updated successfully!');
        } else {
          Alert.alert('Success', 'League settings updated successfully!');
        }
        handleCancelAdminSettings();
        handleRefresh();
      } else {
        myPrint('Failed to update league settings', 'Error');
      }
    } catch (error) {
      myPrint('Error updating league settings', 'Error');
    }
  };

  const handleSendNotifFromAdmin = () => {
    setShowAdminSettingsModal(false);
    notifClicked(curLeague);
  };

  const adminSettingsModal = (
    <Modal
      visible={showAdminSettingsModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancelAdminSettings}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeaderAdminSettings}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pencil color="white" size={24} style={{ marginRight: 10 }} />
            <Text style={styles.modalTitle}>Admin Settings</Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleCancelAdminSettings}
          >
            <X color="white" size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* League Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>League Name *</Text>
            <TextInput
              style={styles.textInput}
              value={editLeagueName}
              onChangeText={setEditLeagueName}
              placeholder="Enter league name"
              maxLength={50}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={editLeagueDescription}
              onChangeText={setEditLeagueDescription}
              placeholder="Enter league description (optional)"
              multiline
              numberOfLines={2}
              maxLength={100}
            />
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={styles.textInput}
              value={editLeagueLocation}
              onChangeText={setEditLeagueLocation}
              placeholder="Example: UIUC Tennis Courts (optional)"
              maxLength={100}
            />
          </View>

          {/* Send Notification Button */}
          <TouchableOpacity
            style={styles.sendNotifButton}
            onPress={handleSendNotifFromAdmin}
          >
            <Text style={styles.sendNotifButtonText}>Send Notification</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelAdminSettings}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleSaveAdminSettings}
          >
            <Text style={styles.createButtonText}>Save Edits</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // LEAGUE CARDS - Unified function for both active and expired leagues
  const renderLeagueCard = (league, isExpired: boolean) => {
    const stats = league?.elo_info[user?.uid];
    const numGames = (stats?.wins || 0) + (stats?.losses || 0) + (stats?.ties || 0);
    const LID = league.league_id;

    return (
      <View key={LID} style={[styles.leagueCard, isExpired && styles.leagueCardExpired]}>
        
        <View style={styles.leagueHeader}>
          
          <View style={styles.leagueHeaderLeft}>
            <Text style={styles.leagueName}>{league.league_name}</Text>
            <Text style={styles.leagueDescription}>{(league.description) ? league.description : ""}</Text>
            {isSmallScreen && <Text style={styles.leagueInfo}>{(league.location) ? ("📍 " + league.location) : "" }</Text>}
          </View>

          <View style={styles.leagueHeaderRight}>
            {isSmallScreen && 
            <TouchableOpacity style={[styles.leagueEnd, !isExpired && { marginRight: 0 }]} onPress={() => {
                if (user?.uid == league?.admin_pid) {
                  setCurLeague(league);
                  setShowDateModal(!showDateModal);
                }
              }}>
              <Text style={styles.leagueEndText}>📅 {league.league_end_date ? (formatDateToMMDDYYYY(league.league_end_date)) : "TBD"}</Text>
            </TouchableOpacity>
            }
            <Text style={styles.leagueInfo}>
              👥 {league.players.length}{!isSmallScreen && " Competitors"}
            </Text>
            {!isSmallScreen && 
              <Text style={styles.leagueInfo}>{(league.location) ? ("📍 " + league.location) : "" }</Text>
            }
          </View>

          {!isSmallScreen && 
            <TouchableOpacity style={[styles.leagueEnd, !isExpired && { marginRight: 5 }]} onPress={() => {
                if (user?.uid == league?.admin_pid) {
                  setCurLeague(league);
                  setShowDateModal(!showDateModal);
                }
              }}>
              <Text style={styles.leagueEndText}>📅 {league.league_end_date ? (formatDateToMMDDYYYY(league.league_end_date)) : "TBD"}</Text>
            </TouchableOpacity>
          }

          <TouchableOpacity style={styles.flagRed} onPress={() => {setReportPlayer(null); setCurLeague(league); setPlayerNotLeague(false); reportClicked()}}>
            <Flag size={22} color="#ff0000"/>
          </TouchableOpacity>
          
        </View>

        {/* Stats Section - 2 columns on small screen, 3 on large */}
        <View style={[styles.statsContainer, isExpired && styles.statsContainerExpired, isSmallScreen && styles.statsContainerSmall]}>
          <View style={[styles.statItem, isSmallScreen && styles.statItemSmall]}>
            <Text style={styles.statLabel}>ELO Rating</Text>
            <Text style={[styles.statValue, { color: getEloColor(stats?.elo || 0) }]}>
              {stats?.elo || ""}
            </Text>
          </View>

          <View style={[styles.statItem, isSmallScreen && styles.statItemSmall]}>
            <Text style={styles.statLabel}>Win Rate</Text>
            <Text style={styles.statValue}>
              {(numGames === 0) ? "--" : getWinRate(stats?.wins || 0, stats?.losses || 0, stats?.ties || 0)}%
            </Text>
          </View>

          <View style={[styles.statItem, isSmallScreen && styles.statItemSmall]}>
            <Text style={styles.statLabel}>Games</Text>
            <Text style={styles.statValue}>{numGames}</Text>
          </View>
        </View>

        {/* W-T-L Record */}
        <View style={[styles.recordContainer, isExpired && styles.recordContainerExpired]}>
          <View style={styles.recordItem}>
            <Text style={styles.recordNumberWin}>{stats?.wins ?? 0}</Text>
            <Text style={styles.recordLabel}>Wins</Text>
          </View>
          <View style={styles.recordSeparator} />
          <View style={styles.recordItem}>
            <Text style={styles.recordNumberLoss}>{stats?.losses ?? 0}</Text>
            <Text style={styles.recordLabel}>Losses</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.viewButton} onPress={() => matchPressed(league)}>
            <Text style={styles.viewButtonText}>Match{isSmallScreen ? "\n" : " "}History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.viewButton} onPress={() => lbPressed(league)}>
            <Text style={styles.viewButtonText}>Leader{isSmallScreen ? "\n" : ""}board</Text>
          </TouchableOpacity>

          { user?.uid === league?.admin_pid ?
          (<TouchableOpacity
            style={styles.adminSettings}
            onPress={() => adminSettingsClicked(league)}
          >
            
            <Text style={styles.leaveButtonText}>
              Admin Settings
            </Text>
          </TouchableOpacity>)
          
          // <TouchableOpacity
          //   style={styles.adminSettingsButton}
          //   onPress={() => adminSettingsClicked(league)}
          // >
          //   <Pencil size={16} color="white" style={{ marginRight: 6 }} />
          //   <Text style={styles.adminSettingsButtonText}>Admin Settings</Text>
          // </TouchableOpacity>
          
          :
          (<TouchableOpacity
            style={styles.leaveButton}
            onPress={() => handleLeaveLeague(LID, league.league_name)}
          >
            <Text style={styles.leaveButtonText}>Leave League</Text>
          </TouchableOpacity>)
          }
        </View>


        {/* Log Game Button - only for active leagues */}
        {!isExpired && (
          <TouchableOpacity
            style={styles.logGameButton}
            onPress={() => logPressed(league)}
          >
            <Text style={styles.logGameButtonText}>+</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const leagueCards = myLeagues.map(league => {
    const leagueExpDate = league.league_end_date;
    const leagueDidExpire = ((leagueExpDate) && leagueExpDate < Date.now()) && expiryImplemented;
    return leagueDidExpire ? null : renderLeagueCard(league, false);
  });

  const expiredLeagueCards = myLeagues.map(league => {
    const leagueExpDate = league.league_end_date;
    const leagueDidExpire = ((leagueExpDate) && leagueExpDate < Date.now()) && expiryImplemented;
    return !leagueDidExpire ? null : renderLeagueCard(league, true);
  });

  // REPORT MODAL
  const reportModal = (
    <Modal
      visible={showReportModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => reportUnclicked()}
    >
      <View style={styles.modalContainer}>
          <View style={styles.reportModalHeader}>
            <Text style={styles.modalTitle}>Report</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => reportUnclicked()}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* League Name */}
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Offending {
              playerNotLeague ? 
                "Player: " + (((reportPlayer?.first_name + " ") || "") + (reportPlayer?.last_name || ""))
              : "League: " + (curLeague?.league_name || "")}
              </Text>
              {/*  {reportPlayer?.first_name || "" + " " + reportPlayer?.last_name || ""} */}
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reasoning *</Text>
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
              onPress={() => reportUnclicked()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.createButton, { backgroundColor: '#a2153fff' }]}
              onPress={() => {handleReportSubmit(); reportUnclicked();}}
            >
              <Text style={styles.createButtonText}>Report</Text>
            </TouchableOpacity>
          </View>
        </View>
    </Modal>
  );

  const horzBar = (
    <View style={{ height: 1, backgroundColor: '#ccc', marginVertical: 40 }}></View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}
    refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh}/>}
    >
      {header}
      {resultsCount}
      {myLeagues.length === 0 ? ( noLeagues ) : ( leagueCards ) }
      {myLeagues.length === 0 ? ( null ) : ( horzBar ) }
      {myLeagues.length === 0 ? ( null ) : ( expiredLeagueCards ) }

      {createLeagueModal}
      {leaderboardModal}
      {logModal}
      {notificationModal}
      {reportModal}
      {matchHistoryModal}
      {dateModal}
      {adminSettingsModal}

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
  },
  modalContentContainerDownwards: {
    flex: 1,
  },
  leftColumn: {
    flexBasis: 0,
    flexGrow: 1,
    borderRightWidth: 2,
    borderRightColor: '#ccc',
  },
  rightColumn: {
    minHeight: 80,
    maxHeight: 400,
    margin: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    overflow: 'hidden',
    backgroundColor: 'white',

    flexDirection: 'row',

    
    
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
    justifyContent: 'flex-start',
    padding: 8,
  },
  lossArea: {
    flex: 1,
    backgroundColor: '#f5d6d6',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 8,
  },
});

const styles = StyleSheet.create({
  spacing: {
    marginVertical: 6,
  },
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
    paddingHorizontal: 5,
  },
  rank: {
    width: 40,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  name: {
    flex: 3,
    paddingHorizontal: 5,
    fontWeight: '500',
  },
  winLoss: {
    flex: 2,
    textAlign: 'center',
    fontWeight: '500',
  },
  elo: {
    flex: 2,
    textAlign: 'center',
    fontWeight: '600',
  },
  eloHeader: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  score: {
    width: 80,
    textAlign: 'center',
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
    textAlign: 'center',
  },
  leagueCard: {
    backgroundColor: 'white',
    margin: 15,
    marginBottom: 40,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
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
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },
  leagueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  leagueHeaderLeft: {
    
    flex: 3,


  },
  leagueHeaderRight: {
    

    flex: 3,
  },
  leagueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8E24AA',
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
    // backgroundColor: '#7e7d7d',
    padding: 5,
    borderRadius: 10,
    fontSize: 26,
    color: '#666',
    justifyContent: 'center',
  },
  leagueEndText: {
    fontSize: 18,
    color: "#666",
    textAlign: 'left',
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
  statsContainerSmall: {
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
  },
  statItemSmall: {
    width: '50%',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8E24AA',
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
    color: '#8E24AA',
  },
  recordNumberWin: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2fdc74ff',
  },
  recordNumberLoss: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#da6161ff',
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
    backgroundColor: 'orange',
    padding: 15,
    borderRadius: 50,
    marginVertical: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 4,
    
    width: 80,
    height: 80,

    justifyContent: 'center',
    marginLeft: 'auto',
    marginRight: 'auto',

    marginBottom: -50,
    borderWidth: 4,
    borderColor: 'white',

    
  },
  logGameButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',

    
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  viewButton: {
    backgroundColor: '#8E24AA',
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
  adminSettings: {
    backgroundColor: '#555',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
  },
  adminSettingsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  adminSettingsPlaceholder: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 40,
  },
  sendNotifButton: {
    backgroundColor: '#8536f4ff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  sendNotifButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#8E24AA',
  },
  reportModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#a2153fff',
  },
  modalHeaderDate: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#737373',
  },
  modalHeaderAdminSettings: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#555',
  },
  modalTitleNotWeb: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
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
    backgroundColor: '#8E24AA',
    borderColor: '#8E24AA',
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
    borderColor: '#8E24AA',
    backgroundColor: '#e3f2fd',
  },
  privacyOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  privacyOptionTextSelected: {
    color: '#8E24AA',
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
    backgroundColor: 'orange',
    alignItems: 'center',
    marginLeft: 10,
  },
  eloScoreButton: {
    
    paddingRight: 20,
    borderRadius: 12,
    backgroundColor: '#a7bde7ff',
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  togglePillContainer: {
    flexDirection: 'row',
    borderRadius: 20,
    backgroundColor: '#ccc',
    alignSelf: 'flex-start', 
    padding: 2,
    marginLeft: 10,
  },
  togglePillButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  togglePillActive: {
    backgroundColor: '#ff9900', 
  },
  togglePillText: {
    color: '#333',
    fontWeight: '500',
  },
  togglePillTextActive: {
    color: 'white',
    fontWeight: '700',
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
    backgroundColor: '#d0f0d0', 
  },
  flagRed: {
    color: '0xff0000',
    padding: 5,
  }
});

const styles_match = StyleSheet.create({
  matchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,

    backgroundColor: 'white',
    

    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
   
    
    width: '95%',
    padding: 10,

    marginLeft: 'auto',
    marginRight: 'auto',


  },
  
  matchModalContainer: {
    backgroundColor: '#f5f5f5',
  },
  card: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  vsText: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  winnerCard: {
    flex: 3,
    
    alignItems: 'flex-start',

        borderLeftWidth: 4,
    borderLeftColor: 'green',
    paddingLeft: 6,

    borderRadius: 4,

  },
  loserCard: {
    flex: 3,
    alignItems: 'flex-end',
    borderRightWidth: 4,
    borderRightColor: 'red',
    paddingRight: 6,
    borderRadius: 4,
    
  },
  dateCard: {
    flex: 1,    
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  names: {
    fontSize: 16,
    color: 'black',
    fontWeight: '700',

  },
  matchDate: {
    fontSize: 14,
    color: 'black',
    fontWeight: '600',
  }

});

const styles_date = StyleSheet.create({dateHintText: {
  fontSize: 12,
  color: '#999',
  marginTop: 4,
  fontStyle: 'italic',
},
leagueInfoBox: {
  backgroundColor: '#f8f9fa',
  padding: 15,
  borderRadius: 8,
  marginTop: 10,
  borderWidth: 1,
  borderColor: '#e0e0e0',
},
leagueInfoTitle: {
  fontSize: 14,
  fontWeight: '600',
  color: '#666',
  marginBottom: 5,
},
leagueInfoText: {
  fontSize: 14,
  color: '#333',
  marginTop: 3,
}
});