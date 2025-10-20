import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CameraStatus = ({ cameraData }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>Camera Status</Text>
      <Text style={styles.sectionSubtitle}>Monitor all connected security cameras</Text>
      
      {cameraData.map(camera => (
        <View key={camera.id} style={styles.cameraItem}>
          <View style={styles.cameraInfo}>
            <Text style={styles.cameraName}>{camera.name}</Text>
            <Text style={styles.cameraLocation}>{camera.location}</Text>
          </View>
          <Text style={[
            styles.cameraStatus,
            camera.status === 'active' ? styles.activeStatus : styles.offlineStatus
          ]}>
            {camera.status}
          </Text>
        </View>
      ))}
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
  cameraItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  cameraInfo: {
    flex: 1,
  },
  cameraName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
  },
  cameraLocation: {
    fontSize: 14,
    color: '#6c757d',
  },
  cameraStatus: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeStatus: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: '#10b981',
  },
  offlineStatus: {
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    color: '#6c757d',
  },
});

export default CameraStatus;