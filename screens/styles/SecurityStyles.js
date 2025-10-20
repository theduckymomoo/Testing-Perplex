import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  statBox: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  panicButton: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    justifyContent: 'center',
  },
  panicText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  navContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  navButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  activeNavButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  navText: {
    color: '#666',
  },
  activeNavText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  securityStatusContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  armedStatus: {
    color: '#4CD964',
  },
  disarmedStatus: {
    color: '#FF3B30',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 10,
    padding: 15,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  controlItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  controlText: {
    fontSize: 16,
  },
  cameraItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cameraInfo: {
    flex: 1,
  },
  cameraName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cameraLocation: {
    fontSize: 14,
    color: '#666',
  },
  cameraStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  activeStatus: {
    color: '#4CD964',
  },
  offlineStatus: {
    color: '#FF3B30',
  },
  alertItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  alertMessage: {
    fontSize: 16,
    marginBottom: 5,
  },
  alertTime: {
    fontSize: 14,
    color: '#666',
  },
  alertPriority: {
    position: 'absolute',
    right: 0,
    top: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 'bold',
  },
  lowPriority: {
    backgroundColor: '#FFCC00',
    color: '#000',
  },
  mediumPriority: {
    backgroundColor: '#FF9500',
    color: '#000',
  },
  highPriority: {
    backgroundColor: '#FF3B30',
    color: '#fff',
  },
  emergencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  emergencyButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  emergencyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  recordButton: {
    backgroundColor: '#FF3B30',
    padding: 10,
    borderRadius: 5,
  },
  recordButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // Add these to your existing SecurityStyles
errorContainer: {
  padding: 16,
  backgroundColor: '#FFEBEE',
  borderRadius: 8,
  marginVertical: 8,
  alignItems: 'center',
},
errorText: {
  color: '#D32F2F',
  fontSize: 14,
},
errorScreen: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
},
errorTitle: {
  fontSize: 24,
  fontWeight: 'bold',
  color: '#D32F2F',
  marginBottom: 16,
},
errorMessage: {
  fontSize: 16,
  color: '#666',
  textAlign: 'center',
  marginBottom: 24,
},
retryButton: {
  backgroundColor: '#007AFF',
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderRadius: 8,
},
retryText: {
  color: 'white',
  fontWeight: 'bold',
},
loadingContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
},
loadingText: {
  marginTop: 16,
  fontSize: 16,
  color: '#666',
},
});