import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';

const EmergencyActions = () => {
  const callSecurity = () => {
    Linking.openURL('tel:1234567890');
  };

  const alertNeighbors = () => {
    alert('Neighbors alerted!');
  };

  const emergencyContact = () => {
    Linking.openURL('tel:0987654321');
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>Emergency Actions</Text>
      <Text style={styles.sectionSubtitle}>Quick access to emergency services and contacts</Text>
      
      <View style={styles.emergencyContainer}>
        <TouchableOpacity style={styles.emergencyButton} onPress={callSecurity}>
          <Text style={styles.emergencyButtonText}>Call Security</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.emergencyButton} onPress={alertNeighbors}>
          <Text style={styles.emergencyButtonText}>Alert Neighbors</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.emergencyButton} onPress={emergencyContact}>
          <Text style={styles.emergencyButtonText}>Emergency Contact</Text>
        </TouchableOpacity>
      </View>
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
  emergencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  emergencyButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    minWidth: '30%',
    alignItems: 'center',
    marginBottom: 8,
  },
  emergencyButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default EmergencyActions;