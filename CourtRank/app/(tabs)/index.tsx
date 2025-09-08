import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useAuth } from '../../contexts/AuthContext';
import { getUserNotifications } from '../../services/firebaseService';
import Svg, { Text as SvgText } from "react-native-svg";
import { osName } from 'expo-device';

const screenWidth = Dimensions.get('window').width;
const eloHistoryImplemented = false;
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

export default function Index() {
  const { user, userInfo, isLoading, logout } = useAuth();
  const [notifs, setNotifs] = useState([]);

  

  
  

  const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  strokeWidth: 2,
  useShadowColorFromDataset: true, 
  decimalPlaces: 0,
  };

  useEffect(() => {
    // Fetch user's leagues from backend
    const getNotifications = async () => {
      try {
        const notifications = await getUserNotifications(user?.uid || "");
        setNotifs(notifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    getNotifications();
  }, [user?.uid]);


  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      {/* Header */}
      <View style={styles.header}>
        {/* <Text style={styles.title}>CourtRank</Text> */}
        <Image source={require('../../assets/images/CourtRankPodiumLogo.png')} style={styles.logoImage}></Image>
      </View>
      
          

      <View style={styles.profileContainer}>
        <View style={styles.circularBanner}>
          <View style={styles.profileImageContainer}>
              {userInfo?.photo_URL ? (
                <Image source={{ uri: userInfo.photo_URL}} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Text style={styles.profileImageText}>
                    {userInfo?.first_name[0]}{userInfo?.last_name[0]}
                  </Text>
                </View>
              )}
          </View>
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{userInfo?.first_name || ""}</Text>
        </View>
      </View>


      {eloHistoryImplemented && <View style={styles.chartContainer}>
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
      </View>}

      {/* Announcements */}
      <View style={styles.announcementsContainer}>
        <Text style={styles.sectionTitle}>Announcements</Text>
        
        {notifs.length === 0 ? (
          <View style={styles.noAnnouncementsContainer}>
            <Text style={styles.noAnnouncementsText}>No new notifications</Text>
            <Text style={styles.noAnnouncementsSubtext}>
              You're all caught up! Check back later for updates.
            </Text>
          </View>
        ) : (
          notifs.map(announcement => (
            <TouchableOpacity
              key={announcement.id}
              style={[
                styles.announcementCard,
                announcement?.isNew && styles.newAnnouncementCard
              ]}
              // onPress={() => markAsRead(announcement.id)}
            >
              <View style={styles.announcementHeader}>
                <View style={styles.announcementIcon}>
                  <Text style={styles.announcementIconText}>
                    📢
                  </Text>
                </View>
                <View style={styles.announcementContent}>
                  <Text style={styles.announcementTitle}>{announcement?.header || ""}</Text>
                  <Text style={styles.announcementLeague}>{announcement?.league_name || ""} --- {announcement?.timestamp.toDate().toLocaleDateString().slice(0,-5)}</Text>
                </View>
              </View>

              <Text style={styles.announcementMessage}>{announcement?.body || ""}</Text>
              {/* <Text style={styles.announcementTimestamp}>{announcement?.timestamp || ""}</Text> */}
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
    
    padding: 20,
    alignItems: 'center',
    paddingTop: osName === 'iOS' ? 40 :20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    fontStyle: 'italic',

      
  },
  logoImage: {
    
    height: 80,
    resizeMode: 'contain',

           shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    marginTop: 5,
  },
  profileContainer: {
  
    margin: 15,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
 
    elevation: 3,
    marginLeft: 'auto',
    marginRight: 'auto',
    width: '100%',

  },
  circularBanner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#8E24AA" ,
    padding: 6,
    marginBottom: 15,
    position: 'relative',
    shadowColor: "#8E24AA" ,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,

    zIndex: 1,
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
    backgroundColor: "#8E24AA" ,
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

    width: '100%',
    
    borderRadius: 10,
    
    
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,

    marginTop: -35,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: "black" ,
    marginTop: 25,
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
    color: "#8E24AA" ,
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
    color: "#8E24AA" ,
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
    shadowOpacity: 0.6,
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
    borderLeftColor: "#8E24AA" ,
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
    backgroundColor: "#8E24AA" ,
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