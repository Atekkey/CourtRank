
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function MyLeagues() {
  const myLeagues = [
    { name: 'Summer Championship', rank: 3, matches: 8, wins: 6, losses: 2 },
    { name: 'Weekend Warriors', rank: 1, matches: 5, wins: 5, losses: 0 },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Leagues</Text>
        <Text style={styles.subtitle}>Your active league participation</Text>
      </View>
      
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>League Summary</Text>
        <Text style={styles.summaryText}>Active Leagues: 2</Text>
        <Text style={styles.summaryText}>Total Matches: 13</Text>
        <Text style={styles.summaryText}>Overall Win Rate: 85%</Text>
      </View>
      
      {myLeagues.map((league, index) => (
        <View key={index} style={styles.leagueCard}>
          <Text style={styles.leagueName}>{league.name}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Rank</Text>
              <Text style={styles.statValue}>#{league.rank}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Matches</Text>
              <Text style={styles.statValue}>{league.matches}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>W-L</Text>
              <Text style={styles.statValue}>{league.wins}-{league.losses}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      ))}
      
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>+ Join New League</Text>
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
  summaryCard: {
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f95dc',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 2,
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
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f95dc',
  },
  viewButton: {
    backgroundColor: '#2f95dc',
    padding: 12,
    borderRadius: 8,
  },
  viewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    margin: 15,
    padding: 15,
    borderRadius: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});