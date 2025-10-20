// FILE: ReportsScreen.js
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function ReportsScreen() {
  const navigation = useNavigation();

  const ReportButton = ({ title, icon }) => (
    <TouchableOpacity style={reportStyles.card} onPress={() => alert(`Generating ${title}`)}>
      <MaterialIcons name={icon} size={30} color="#f59e0b" />
      <Text style={reportStyles.cardTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>View Reports</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Generate & View Analytics</Text>
          <View style={reportStyles.grid}>
            <ReportButton title="User Growth" icon="person-add" />
            <ReportButton title="Device Usage" icon="devices-other" />
            <ReportButton title="Energy Savings" icon="eco" />
            <ReportButton title="System Health" icon="monitor-heart" />
            <ReportButton title="Financial Projections" icon="attach-money" />
            <ReportButton title="Admin Activity" icon="security" />
          </View>
          <Text style={styles.placeholderText}>
            This screen would typically embed charts and allow filtering for historical data.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... (Re-use styles from ManageDevicesScreen for container/header/etc)
  container: { flex: 1, backgroundColor: '#0a0a0b' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    paddingLeft: 10,
  },
  placeholderText: {
    fontSize: 14,
    color: '#a1a1aa',
    textAlign: 'center',
    marginTop: 20,
    padding: 10,
  },
});

const reportStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  card: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardTitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
});