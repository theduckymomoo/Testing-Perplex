// LoadsheddingOverviewModal.js - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Vibration,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const LoadsheddingOverviewModal = ({ 
  visible, 
  onClose, 
  loadshedding, 
  appliances = [],
  onPrepareDevices,
  onGoToLoadshedding,
  onGoToControls,
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(height));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 25,
          stiffness: 120,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getStageColor = () => {
    if (loadshedding.stage === 0) return '#10b981';
    if (loadshedding.stage <= 2) return '#f59e0b';
    if (loadshedding.stage <= 4) return '#f97316';
    return '#ef4444';
  };

  const getStageInfo = () => {
    const stage = loadshedding.stage;
    const info = {
      0: { title: 'No Loadshedding', severity: 'All Clear', impact: 'Normal operations' },
      1: { title: 'Stage 1', severity: 'Low', impact: '1000 MW shortage' },
      2: { title: 'Stage 2', severity: 'Moderate', impact: '2000 MW shortage' },
      3: { title: 'Stage 3', severity: 'High', impact: '3000 MW shortage' },
      4: { title: 'Stage 4', severity: 'Severe', impact: '4000 MW shortage' },
      5: { title: 'Stage 5', severity: 'Critical', impact: '5000 MW shortage' },
      6: { title: 'Stage 6', severity: 'Extreme', impact: '6000 MW shortage' },
      7: { title: 'Stage 7', severity: 'Catastrophic', impact: '7000 MW shortage' },
      8: { title: 'Stage 8', severity: 'Unprecedented', impact: '8000 MW shortage' },
    };
    return info[stage] || info[0];
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-ZA', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString('en-ZA', { 
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const getTimeUntilOutage = () => {
    if (!loadshedding.nextSlot) return null;
    
    const now = new Date();
    const start = new Date(loadshedding.nextSlot.start);
    const diff = start - now;
    
    if (diff <= 0) {
      const end = new Date(loadshedding.nextSlot.end);
      const endDiff = end - now;
      if (endDiff > 0) {
        const hours = Math.floor(endDiff / (1000 * 60 * 60));
        const minutes = Math.floor((endDiff % (1000 * 60 * 60)) / (1000 * 60));
        return `Ends in ${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
      }
      return 'Ended';
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `in ${hours}h ${minutes}m`;
    }
    return `in ${minutes} minutes`;
  };

  // Calculate device stats
  const activeDevices = appliances.filter(app => app.status === 'on');
  const totalPower = activeDevices.reduce((sum, app) => sum + (app.current_power || app.normal_usage), 0);
  
  const essentialDevices = appliances.filter(app => 
    ['refrigerator', 'router', 'camera'].includes(app.type)
  );
  const activeEssential = essentialDevices.filter(app => app.status === 'on');
  
  const highUsageDevices = activeDevices.filter(app => {
    const isEssential = essentialDevices.some(e => e.id === app.id);
    return !isEssential && (app.current_power || app.normal_usage) > 300;
  });
  
  const otherDevicesCount = Math.max(0, appliances.length - essentialDevices.length - highUsageDevices.length);

  const stageInfo = getStageInfo();
  const stageColor = getStageColor();
  const timeUntil = getTimeUntilOutage();

  const handleClose = () => {
    Vibration.vibrate(50);
    onClose();
  };

  const handlePrepare = () => {
    Vibration.vibrate(100);
    onPrepareDevices?.();
  };

  const handleViewLoadshedding = () => {
    Vibration.vibrate(50);
    onGoToLoadshedding?.();
  };

  const handleViewControls = () => {
    Vibration.vibrate(50);
    onGoToControls?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity 
          style={styles.overlayTouch} 
          activeOpacity={1} 
          onPress={handleClose}
        />
        
        <Animated.View 
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: stageColor }]}>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <MaterialIcons name="flash-off" size={32} color="#ffffff" />
                <View style={styles.headerText}>
                  <Text style={styles.headerTitle}>{stageInfo.title}</Text>
                  <Text style={styles.headerSubtitle}>{stageInfo.severity}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView 
            style={styles.content} 
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            directionalLockEnabled={true}
            scrollEventThrottle={16}
            nestedScrollEnabled={false}
            bounces={true}
            alwaysBounceHorizontal={false}
          >
            {/* Status Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Current Status</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <MaterialIcons name="location-on" size={20} color="#10b981" />
                  <Text style={styles.summaryLabel}>Area</Text>
                  <Text style={styles.summaryValue}>{loadshedding.area || 'Not set'}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <MaterialIcons name="bolt" size={20} color="#f59e0b" />
                  <Text style={styles.summaryLabel}>Impact</Text>
                  <Text style={styles.summaryValue}>{stageInfo.impact}</Text>
                </View>
              </View>
            </View>

            {/* Next Outage */}
            {loadshedding.nextSlot && (
              <View style={styles.outageCard}>
                <View style={styles.outageHeader}>
                  <MaterialIcons name="schedule" size={24} color="#ef4444" />
                  <Text style={styles.outageTitle}>Next Outage</Text>
                  {timeUntil && (
                    <View style={styles.timeBadge}>
                      <Text style={styles.timeBadgeText}>{timeUntil}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.outageTime}>
                  <View style={styles.timeColumn}>
                    <Text style={styles.timeLabel}>Starts</Text>
                    <Text style={styles.timeValue}>{formatTime(loadshedding.nextSlot.start)}</Text>
                    <Text style={styles.dateValue}>{formatDate(loadshedding.nextSlot.start)}</Text>
                  </View>
                  <MaterialIcons name="arrow-forward" size={20} color="#6b7280" />
                  <View style={styles.timeColumn}>
                    <Text style={styles.timeLabel}>Ends</Text>
                    <Text style={styles.timeValue}>{formatTime(loadshedding.nextSlot.end)}</Text>
                    <Text style={styles.dateValue}>{formatDate(loadshedding.nextSlot.end)}</Text>
                  </View>
                </View>

                {loadshedding.stage > 0 && timeUntil && timeUntil.includes('minutes') && (
                  <View style={styles.urgentBanner}>
                    <MaterialIcons name="warning" size={20} color="#ef4444" />
                    <Text style={styles.urgentText}>
                      Outage starting soon! Prepare your devices.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Device Overview */}
            {appliances.length > 0 && (
              <View style={styles.devicesCard}>
                <View style={styles.devicesHeader}>
                  <MaterialIcons name="devices" size={24} color="#3b82f6" />
                  <Text style={styles.devicesTitle}>Your Devices</Text>
                </View>

                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{appliances.length}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statNumber, styles.activeNumber]}>{activeDevices.length}</Text>
                    <Text style={styles.statLabel}>Active</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{totalPower}W</Text>
                    <Text style={styles.statLabel}>Power</Text>
                  </View>
                </View>

                {highUsageDevices.length > 0 && (
                  <View style={styles.warningBox}>
                    <MaterialIcons name="warning" size={18} color="#f59e0b" />
                    <Text style={styles.warningText}>
                      {highUsageDevices.length} high-usage {highUsageDevices.length === 1 ? 'device' : 'devices'} currently active
                    </Text>
                  </View>
                )}

                {activeEssential.length > 0 && (
                  <View style={styles.infoBox}>
                    <MaterialIcons name="shield" size={18} color="#10b981" />
                    <Text style={styles.infoText}>
                      {activeEssential.length} essential {activeEssential.length === 1 ? 'device' : 'devices'} protected
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Device Breakdown */}
            {appliances.length > 0 && (
              <View style={styles.breakdownCard}>
                <Text style={styles.breakdownTitle}>Device Breakdown</Text>
                
                <View style={styles.breakdownItem}>
                  <View style={styles.breakdownLeft}>
                    <View style={[styles.breakdownDot, { backgroundColor: '#10b981' }]} />
                    <Text style={styles.breakdownLabel}>Essential Devices</Text>
                  </View>
                  <Text style={styles.breakdownValue}>{essentialDevices.length}</Text>
                </View>

                <View style={styles.breakdownItem}>
                  <View style={styles.breakdownLeft}>
                    <View style={[styles.breakdownDot, { backgroundColor: '#f97316' }]} />
                    <Text style={styles.breakdownLabel}>High Usage</Text>
                  </View>
                  <Text style={styles.breakdownValue}>{highUsageDevices.length}</Text>
                </View>

                <View style={styles.breakdownItem}>
                  <View style={styles.breakdownLeft}>
                    <View style={[styles.breakdownDot, { backgroundColor: '#6b7280' }]} />
                    <Text style={styles.breakdownLabel}>Other Devices</Text>
                  </View>
                  <Text style={styles.breakdownValue}>{otherDevicesCount}</Text>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              {loadshedding.stage > 0 && activeDevices.length > 0 && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={handlePrepare}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="power-settings-new" size={20} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Prepare for Outage</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={handleViewLoadshedding}
                activeOpacity={0.8}
              >
                <MaterialIcons name="flash-off" size={20} color="#ffffff" />
                <Text style={styles.actionButtonText}>View Loadshedding</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={handleViewControls}
                activeOpacity={0.8}
              >
                <MaterialIcons name="tune" size={20} color="#ffffff" />
                <Text style={styles.actionButtonText}>Manage Devices</Text>
              </TouchableOpacity>
            </View>

            {/* Tips */}
            {loadshedding.stage > 0 && (
              <View style={styles.tipsCard}>
                <View style={styles.tipsHeader}>
                  <MaterialIcons name="lightbulb" size={20} color="#f59e0b" />
                  <Text style={styles.tipsTitle}>Quick Tips</Text>
                </View>
                <Text style={styles.tipText}>• Turn off non-essential high-usage devices</Text>
                <Text style={styles.tipText}>• Keep refrigerators and freezers closed</Text>
                <Text style={styles.tipText}>• Charge all portable devices now</Text>
                <Text style={styles.tipText}>• Enable automation to manage devices automatically</Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  overlayTouch: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: '#0a0a0b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    height: height * 0.85,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  outageCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  outageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  outageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  timeBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ef4444',
  },
  outageTime: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeColumn: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 11,
    color: '#a1a1aa',
    marginBottom: 4,
    fontWeight: '600',
  },
  timeValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 12,
    borderRadius: 8,
  },
  urgentText: {
    flex: 1,
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
  },
  devicesCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  devicesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  devicesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
  },
  activeNumber: {
    color: '#10b981',
  },
  statLabel: {
    fontSize: 11,
    color: '#a1a1aa',
    fontWeight: '500',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#f59e0b',
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#10b981',
    fontWeight: '600',
  },
  breakdownCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#a1a1aa',
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: '#ef4444',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  tipsCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  tipText: {
    fontSize: 13,
    color: '#a1a1aa',
    lineHeight: 22,
    marginBottom: 6,
  },
});

export default LoadsheddingOverviewModal;