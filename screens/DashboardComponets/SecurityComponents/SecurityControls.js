import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';

const SecurityControls = ({
  securityStatus,
  toggleSecurityStatus,
  motionDetection,
  toggleMotionDetection,
  fireDetection,
  toggleFireDetection
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>Security Controls</Text>
      <Text style={styles.sectionSubtitle}>Manage your security system settings</Text>
      
      <View style={styles.controlItem}>
        <View style={styles.controlTextContainer}>
          <Text style={styles.controlText}>Security Mode</Text>
          <Text style={styles.controlSubtext}>Arm/disarm security system</Text>
        </View>
        <Switch
          value={securityStatus === 'ARMED'}
          onValueChange={toggleSecurityStatus}
          style={styles.switch}
          trackColor={{ false: '#374151', true: '#10b981' }}
          thumbColor={securityStatus === 'ARMED' ? '#ffffff' : '#9ca3af'}
        />
      </View>
      
      <View style={styles.controlItem}>
        <View style={styles.controlTextContainer}>
          <Text style={styles.controlText}>Motion Detection</Text>
          <Text style={styles.controlSubtext}>Enable/disable motion sensors</Text>
        </View>
        <Switch
          value={motionDetection}
          onValueChange={toggleMotionDetection}
          style={styles.switch}
          trackColor={{ false: '#374151', true: '#10b981' }}
          thumbColor={motionDetection ? '#ffffff' : '#9ca3af'}
        />
      </View>
      
      <View style={styles.controlItem}>
        <View style={styles.controlTextContainer}>
          <Text style={styles.controlText}>Fire Detection</Text>
          <Text style={styles.controlSubtext}>Enable/disable fire alarms</Text>
        </View>
        <Switch
          value={fireDetection}
          onValueChange={toggleFireDetection}
          style={styles.switch}
          trackColor={{ false: '#374151', true: '#10b981' }}
          thumbColor={fireDetection ? '#ffffff' : '#9ca3af'}
        />
      </View>
      
      <TouchableOpacity style={styles.recordButton}>
        <Text style={styles.recordButtonText}>Start Emergency Recording</Text>
      </TouchableOpacity>
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
    marginBottom: 20,
    color: '#6c757d',
    fontSize: 14,
  },
  controlItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  controlTextContainer: {
    flex: 1,
  },
  controlText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  controlSubtext: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  recordButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  recordButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default SecurityControls;