// DashboardComponets/SecurityTab.js
import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import SecurityControls from './SecurityComponents/SecurityControls'
import CameraStatus from './SecurityComponents/CameraStatus';
import RecentAlerts from './SecurityComponents/RecentAlerts';
import EmergencyActions from './SecurityComponents/EmergencyAct';

const SecurityTab = () => {
  const [securityStatus, setSecurityStatus] = useState('DISARMED');
  const [activeCameras, setActiveCameras] = useState(3);
  const [recentAlerts, setRecentAlerts] = useState(3);
  const [motionDetection, setMotionDetection] = useState(true);
  const [fireDetection, setFireDetection] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [screenError, setScreenError] = useState(false);

  // Safe component wrapper with error boundary
  const SafeComponent = ({ children, componentName }) => {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
      const errorListener = (error) => {
        if (error.message.includes('container')) {
          setHasError(true);
          console.log(`Error in ${componentName}:`, error);
        }
      };

      const originalError = console.error;
      console.error = (...args) => {
        originalError.apply(console, args);
        if (args[0]?.message) {
          errorListener(args[0]);
        }
      };

      return () => {
        console.error = originalError;
      };
    }, [componentName]);

    if (hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {componentName} temporarily unavailable
          </Text>
        </View>
      );
    }

    return children;
  };

  const toggleSecurityStatus = () => {
    setSecurityStatus(securityStatus === 'DISARMED' ? 'ARMED' : 'DISARMED');
  };

  const toggleMotionDetection = () => {
    setMotionDetection(!motionDetection);
  };

  const toggleFireDetection = () => {
    setFireDetection(!fireDetection);
  };

  const alertsData = [
    { id: 1, message: 'Motion detected in Living Room', time: '2 minutes ago', priority: 'MEDIUM' },
    { id: 2, message: 'Front door opened', time: '15 minutes ago', priority: 'LOW' },
    { id: 3, message: 'High temperature detected - Kitchen', time: '1 hour ago', priority: 'HIGH' },
  ];

  const cameraData = [
    { id: 1, name: 'Living Room', location: 'Ground Floor', status: 'active' },
    { id: 2, name: 'Kitchen', location: 'Ground Floor', status: 'active' },
    { id: 3, name: 'Front Door', location: 'Entrance', status: 'active' },
    { id: 4, name: 'Backyard', location: 'Outdoor', status: 'offline' },
  ];

  if (screenError) {
    return (
      <View style={styles.errorScreen}>
        <Text style={styles.errorTitle}>System Error</Text>
        <Text style={styles.errorMessage}>
          Security system is experiencing technical difficulties
        </Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => setScreenError(false)}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading Security System...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      howsVerticalScrollIndicator={false}
      directionalLockEnabled={true}
      scrollEventThrottle={16}
      nestedScrollEnabled={false}
      bounces={true}
      alwaysBounceHorizontal={false}
      >
      {/* Stats Container */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{securityStatus === 'ARMED' ? 'ARMED' : 'DISARMED'}</Text>
          <Text style={styles.statLabel}>Security Status</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{activeCameras}/4</Text>
          <Text style={styles.statLabel}>Active Cameras</Text>
        </View>
        <TouchableOpacity style={styles.panicButton}>
          <Text style={styles.panicText}>PANIC</Text>
        </TouchableOpacity>
      </View>

      {/* Security Controls */}
      <SafeComponent componentName="SecurityControls">
        <SecurityControls 
          securityStatus={securityStatus}
          toggleSecurityStatus={toggleSecurityStatus}
          motionDetection={motionDetection}
          toggleMotionDetection={toggleMotionDetection}
          fireDetection={fireDetection}
          toggleFireDetection={toggleFireDetection}
        />
      </SafeComponent>

      {/* Camera Status */}
      <SafeComponent componentName="CameraStatus">
        <CameraStatus cameraData={cameraData} />
      </SafeComponent>

      {/* Recent Alerts */}
      <SafeComponent componentName="RecentAlerts">
        <RecentAlerts alertsData={alertsData} />
      </SafeComponent>

      {/* Emergency Actions */}
      <SafeComponent componentName="EmergencyActions">
        <EmergencyActions />
      </SafeComponent>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0b',
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#111827',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
  },
  panicButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  panicText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 14,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
  },
  errorScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#0a0a0b',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  retryText: {
    color: '#10b981',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0b',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6c757d',
  },
});

export default SecurityTab;