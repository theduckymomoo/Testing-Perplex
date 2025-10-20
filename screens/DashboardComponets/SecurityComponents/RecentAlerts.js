import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const RecentAlerts = ({ alertsData }) => {
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'LOW': return styles.lowPriority;
      case 'MEDIUM': return styles.mediumPriority;
      case 'HIGH': return styles.highPriority;
      default: return styles.lowPriority;
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>Recent Alerts</Text>
      <Text style={styles.sectionSubtitle}>Latest security notifications and events</Text>
      
      <ScrollView style={styles.scrollView}>
        {alertsData.map(alert => (
          <View key={alert.id} style={styles.alertItem}>
            <Text style={styles.alertMessage}>{alert.message}</Text>
            <View style={styles.alertFooter}>
              <Text style={styles.alertTime}>{alert.time}</Text>
              <Text style={[styles.alertPriority, getPriorityStyle(alert.priority)]}>
                {alert.priority}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#111827',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    maxHeight: 300,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 8,
  },
  sectionSubtitle: {
    marginBottom: 15,
    color: '#6c757d',
    fontSize: 14,
  },
  scrollView: {
    maxHeight: 200,
  },
  alertItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#6c757d',
  },
  alertMessage: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 6,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTime: {
    fontSize: 12,
    color: '#6c757d',
  },
  alertPriority: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lowPriority: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: '#10b981',
  },
  mediumPriority: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    color: '#f59e0b',
  },
  highPriority: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
  },
});

export default RecentAlerts;