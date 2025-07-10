import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function DiscoverLeagues() {
  const leagues = [
    { name: 'Summer Championship', players: 24, level: 'Intermediate', fee: '$50' },
    { name: 'Beginner Friendly League', players: 16, level: 'Beginner', fee: '$30' },
    { name: 'Advanced Tournament', players: 12, level: 'Advanced', fee: '$75' },
    { name: 'Weekend Warriors', players: 20, level: 'Mixed', fee: '$40' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover Leagues</Text>
        <Text style={styles.subtitle}>Find and join tennis leagues near you</Text>
      </View>
      
      <View style={styles.searchSection}>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>Filter by Level</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>Filter by Location</Text>
        </TouchableOpacity>
      </View>
      
      {leagues.map((league, index) => (
        <View key={index} style={styles.leagueCard}>
          <Text style={styles.leagueName}>{league.name}</Text>
          <Text style={styles.leagueInfo}>Level: {league.level}</Text>
          <Text style={styles.leagueInfo}>Players: {league.players}</Text>
          <Text style={styles.leagueInfo}>Entry Fee: {league.fee}</Text>
          <TouchableOpacity style={styles.joinButton}>
            <Text style={styles.joinButtonText}>Join League</Text>
          </TouchableOpacity>
        </View>
      ))}
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
  searchSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
  },
  filterButton: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterText: {
    color: '#2f95dc',
    fontSize: 14,
    fontWeight: '500',
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
  joinButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
