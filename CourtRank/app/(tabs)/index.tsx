import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useAuth } from '../../contexts/AuthContext';

const screenWidth = Dimensions.get('window').width;

// Mock data for ELO over time
const mockEloData = {
  labels: ['1/25', '2/25', '3/25', '4/25', '5/25', '6/25'],
  datasets: [
    {
      data: [1420, 1450, 1580, 1520, 1580, 1647],
      color: (opacity = 1) => `rgba(47, 149, 220, ${opacity})`,
      strokeWidth: 3,
    },
    {
      data: [1200, 1250, 1300, 1280, 1320, 1350],
      color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
      strokeWidth: 3,
    },
    {
      data: [1600, 1580, 1620, 1650, 1630, 1680],
      color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Green
      strokeWidth: 3,
    },
  ],
};

const eloLegend = [
  { name: 'Basketball League', color: '#2f95dc' },
  { name: 'Tennis Club', color: '#FF9800' },
  { name: 'Volleyball League', color: '#4CAF50' },
];

// Mock announcements data
const mockAnnouncements = [
  {
    id: '1',
    type: 'league_ending',
    title: 'Downtown Basketball League Season Ending',
    message: 'Season ends in 5 days! Final rankings will be calculated.',
    timestamp: '2 hours ago',
    league: 'Downtown Basketball League',
    isNew: true,
  },
  {
    id: '2',
    type: 'admin_announcement',
    title: 'New Court Added - Riverside Tennis',
    message: 'We\'ve added a new court location at Riverside Park. Check it out!',
    timestamp: '1 day ago',
    league: 'Riverside Tennis Club',
    isNew: true,
  },
  {
    id: '3',
    type: 'league_ending',
    title: 'Volleyball Championship Finals',
    message: 'Championship match scheduled for this weekend. Good luck!',
    timestamp: '2 days ago',
    league: 'Morning Volleyball League',
    isNew: false,
  },
  {
    id: '4',
    type: 'admin_announcement',
    title: 'Updated Match Rules',
    message: 'New scoring system implemented. Please review the updated rules.',
    timestamp: '3 days ago',
    league: 'City Soccer Championship',
    isNew: false,
  },
];

// Mock user data
const mockUser = {
  name: 'Alex Johnson',
  currentElo: 1647,
  profileImage: null, // Will use placeholder
  rank: 10,
  totalGames: 47,
  winRate: 68,
};

export default function Index() {
  const [announcements, setAnnouncements] = useState(mockAnnouncements);
  const [user, setUser] = useState(mockUser);
  const { user: authUser } = useAuth();

  const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  strokeWidth: 2,
  useShadowColorFromDataset: true, 
  decimalPlaces: 0,
};

  const getAnnouncementIcon = (type) => {
    switch (type) {
      case 'league_ending':
        return '⏰';
      case 'admin_announcement':
        return '📢';
      default:
        return '📝';
    }
  };

  const getEloColor = (elo) => {
    if (elo >= 2000) return '#4CAF50'; // Green for high ELO
    if (elo >= 1600) return '#FF9800'; // Orange for medium-high ELO
    if (elo >= 1200) return '#2196F3'; // Blue for decent ELO
    return '#666'; // Gray for low ELO
  };

  const markAsRead = (announcementId) => {
    setAnnouncements(prev => 
      prev.map(announcement => 
        announcement.id === announcementId 
          ? { ...announcement, isNew: false }
          : announcement
      )
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>CourtRank</Text>
        <Text style={styles.subtitle}>Welcome back, {user.name}!</Text>
      </View>

      {/* Profile Section with Circular Banner */}
      <View style={styles.profileContainer}>
        <View style={styles.circularBanner}>
          <View style={styles.profileImageContainer}>
            {user.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImageText}>
                  {user.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user.name}</Text>
          <View style={styles.profileStats}>
            {/* <View style={styles.statItem}>
              <Text style={[styles.currentElo, { color: getEloColor(user.currentElo) }]}>
                {user.currentElo}
              </Text>
              <Text style={styles.statLabel}>Current ELO</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>#{user.rank}</Text>
              <Text style={styles.statLabel}>Best Rank</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.winRate}%</Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </View> */}
          </View>
        </View>
      </View>

      {/* ELO Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>ELO History</Text>
        <LineChart
          data={mockEloData}
          width={screenWidth - 40}
          height={200}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withDots={true}
          withShadow={true}
          withInnerLines={true}
          withOuterLines={true}
          yAxisInterval={1}
        />
        {/* ELO Legend */}
        <View style={styles.legendContainer}>
        {eloLegend.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.name}</Text>
          </View>
        ))}
      </View>
      </View>

      {/* Announcements */}
      <View style={styles.announcementsContainer}>
        <Text style={styles.sectionTitle}>Announcements</Text>
        
        {announcements.length === 0 ? (
          <View style={styles.noAnnouncementsContainer}>
            <Text style={styles.noAnnouncementsText}>No new announcements</Text>
            <Text style={styles.noAnnouncementsSubtext}>
              You're all caught up! Check back later for updates.
            </Text>
          </View>
        ) : (
          announcements.map(announcement => (
            <TouchableOpacity
              key={announcement.id}
              style={[
                styles.announcementCard,
                announcement.isNew && styles.newAnnouncementCard
              ]}
              onPress={() => markAsRead(announcement.id)}
            >
              <View style={styles.announcementHeader}>
                <View style={styles.announcementIcon}>
                  <Text style={styles.announcementIconText}>
                    {getAnnouncementIcon(announcement.type)}
                  </Text>
                </View>
                <View style={styles.announcementContent}>
                  <Text style={styles.announcementTitle}>{announcement.title}</Text>
                  <Text style={styles.announcementLeague}>{announcement.league}</Text>
                </View>
                {announcement.isNew && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.announcementMessage}>{announcement.message}</Text>
              <Text style={styles.announcementTimestamp}>{announcement.timestamp}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
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
  profileContainer: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  circularBanner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#2f95dc',
    padding: 6,
    marginBottom: 15,
    position: 'relative',
    shadowColor: '#2f95dc',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  profileImageContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2f95dc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2f95dc',
    marginBottom: 15,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  currentElo: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2f95dc',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f95dc',
    marginBottom: 15,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  announcementsContainer: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noAnnouncementsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noAnnouncementsText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  noAnnouncementsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  announcementCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2f95dc',
  },
  newAnnouncementCard: {
    backgroundColor: '#e3f2fd',
    borderLeftColor: '#FF9800',
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  announcementIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2f95dc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  announcementIconText: {
    fontSize: 16,
  },
  announcementContent: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  announcementLeague: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  newBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  newBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  announcementMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    lineHeight: 20,
  },
  announcementTimestamp: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  legendContainer: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  marginTop: 15,
  flexWrap: 'wrap',
},
legendItem: {
  flexDirection: 'row',
  alignItems: 'center',
  marginVertical: 5,
},
legendColor: {
  width: 12,
  height: 12,
  borderRadius: 6,
  marginRight: 6,
},
legendText: {
  fontSize: 12,
  color: '#666',
},
  
});