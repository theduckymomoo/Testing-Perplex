import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from './SimulationStyles';
import mlService from '../MLEngine/MLService';

export default function SimulationControls({ visible, onClose, appliances, onSimulationUpdate }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(24);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState({});
  const [isFastForwarding, setIsFastForwarding] = useState(false);

  useEffect(() => {
    if (visible && appliances.length > 0) {
      initializeSimulation();
    }
  }, [visible, appliances]);

  const initializeSimulation = async () => {
    try {
      const result = await mlService.initializeSimulation(appliances);
      if (result.success) {
        setStatus(result.status);
        console.log('✅ Simulation initialized');
      }
    } catch (error) {
      console.error('Error initializing simulation:', error);
    }
  };

  const startSimulation = async () => {
    const result = await mlService.startSimulation(simulationSpeed, (update) => {
      setStatus(mlService.getSimulationStatus());
      if (onSimulationUpdate) {
        onSimulationUpdate(update);
      }
    });
    
    if (result.success) {
      setIsSimulating(true);
      setStatus(result.status);
    }
  };

  const stopSimulation = async () => {
    const result = await mlService.stopSimulation();
    setIsSimulating(false);
    setStatus(result.status);
  };

  const fastForward = async (days = 7) => {
    setIsFastForwarding(true);
    setProgress(0);
    
    const result = await mlService.fastForwardSimulation(days, (progressUpdate) => {
      setProgress(progressUpdate.progress);
    });
    
    setIsFastForwarding(false);
    
    if (result.success) {
      Alert.alert(
        'Fast-Forward Complete',
        `Generated ${result.samplesGenerated} training samples from ${result.simulatedDays} simulated days!`,
        [{ text: 'OK' }]
      );
      setStatus(result.status);
    }
  };

  const resetSimulation = async () => {
    await mlService.resetSimulation();
    setStatus(mlService.getSimulationStatus());
    setProgress(0);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🎮 ML Training Simulator</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#a1a1aa" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <MaterialIcons 
                name={isSimulating ? "play-arrow" : "pause"} 
                size={24} 
                color={isSimulating ? "#10b981" : "#a1a1aa"} 
              />
              <Text style={styles.statusTitle}>
                {isSimulating ? 'Simulation Running' : 'Simulation Ready'}
              </Text>
            </View>
            <View style={styles.statusGrid}>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Simulated Days</Text>
                <Text style={styles.statusValue}>{status.simulatedDays || 0}</Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Training Samples</Text>
                <Text style={styles.statusValue}>{status.totalSamples || 0}</Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Current Speed</Text>
                <Text style={styles.statusValue}>{simulationSpeed}x</Text>
              </View>
            </View>
          </View>

          {/* Speed Control */}
          <View style={styles.controlCard}>
            <Text style={styles.controlTitle}>Simulation Speed</Text>
            <Text style={styles.controlSubtitle}>How fast time advances (hours per minute)</Text>
            
            <View style={styles.sliderContainer}>
              <Text style={styles.speedLabel}>1x</Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={168} // 1 week per minute
                step={1}
                value={simulationSpeed}
                onValueChange={setSimulationSpeed}
                minimumTrackTintColor="#10b981"
                maximumTrackTintColor="#374151"
                thumbTintColor="#10b981"
              />
              <Text style={styles.speedLabel}>168x</Text>
            </View>
            
            <Text style={styles.currentSpeed}>{simulationSpeed}x speed</Text>
          </View>

          {/* Real-time Simulation Controls */}
          <View style={styles.controlCard}>
            <Text style={styles.controlTitle}>Real-time Simulation</Text>
            <Text style={styles.controlSubtitle}>
              Watch devices turn on/off based on realistic patterns
            </Text>
            
            <View style={styles.buttonRow}>
              {!isSimulating ? (
                <TouchableOpacity 
                  style={[styles.button, styles.primaryButton]}
                  onPress={startSimulation}
                >
                  <MaterialIcons name="play-arrow" size={20} color="#ffffff" />
                  <Text style={styles.buttonText}>Start Simulation</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.button, styles.secondaryButton]}
                  onPress={stopSimulation}
                >
                  <MaterialIcons name="pause" size={20} color="#ffffff" />
                  <Text style={styles.buttonText}>Stop Simulation</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.button, styles.outlineButton]}
                onPress={resetSimulation}
              >
                <MaterialIcons name="refresh" size={20} color="#a1a1aa" />
                <Text style={styles.outlineButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Fast-Forward Section */}
          <View style={styles.controlCard}>
            <Text style={styles.controlTitle}>Quick Data Generation</Text>
            <Text style={styles.controlSubtitle}>
              Fast-forward time to generate training data instantly
            </Text>

            {isFastForwarding && (
              <View style={styles.progressContainer}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.progressText}>Generating data... {progress}%</Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[styles.progressFill, { width: `${progress}%` }]} 
                  />
                </View>
              </View>
            )}

            <View style={styles.fastForwardGrid}>
              <TouchableOpacity 
                style={styles.fastForwardButton}
                onPress={() => fastForward(1)}
                disabled={isFastForwarding}
              >
                <MaterialIcons name="fast-forward" size={20} color="#10b981" />
                <Text style={styles.fastForwardText}>1 Day</Text>
                <Text style={styles.fastForwardSubtext}>~24 samples</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.fastForwardButton}
                onPress={() => fastForward(7)}
                disabled={isFastForwarding}
              >
                <MaterialIcons name="fast-forward" size={20} color="#10b981" />
                <Text style={styles.fastForwardText}>1 Week</Text>
                <Text style={styles.fastForwardSubtext}>~168 samples</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.fastForwardButton}
                onPress={() => fastForward(30)}
                disabled={isFastForwarding}
              >
                <MaterialIcons name="fast-forward" size={20} color="#10b981" />
                <Text style={styles.fastForwardText}>1 Month</Text>
                <Text style={styles.fastForwardSubtext}>~720 samples</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ML Training Status */}
          <View style={styles.controlCard}>
            <Text style={styles.controlTitle}>ML Training Progress</Text>
            
            <View style={styles.trainingProgress}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressLabel}>
                  Data Collection: {mlService.getTrainingProgress().current} / {mlService.getTrainingProgress().required} samples
                </Text>
                <Text style={styles.progressPercent}>
                  {mlService.getTrainingProgress().progress}%
                </Text>
              </View>
              
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${mlService.getTrainingProgress().progress}%` }
                  ]} 
                />
              </View>
              
              <Text style={styles.progressStatus}>
                {mlService.getTrainingProgress().status === 'ready' ? 
                  'Ready to train!' : 
                  'Collecting more data...'
                }
              </Text>
            </View>

            <TouchableOpacity 
              style={[
                styles.button, 
                styles.primaryButton,
                !mlService.getTrainingProgress().canTrain && styles.buttonDisabled
              ]}
              onPress={() => mlService.trainModels()}
              disabled={!mlService.getTrainingProgress().canTrain}
            >
              <MaterialIcons name="model-training" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Train ML Models</Text>
            </TouchableOpacity>
          </View>

          {/* Info Section */}
          <View style={styles.infoCard}>
            <MaterialIcons name="info" size={20} color="#3b82f6" />
            <Text style={styles.infoText}>
              The simulator creates realistic device usage patterns based on time of day, 
              day of week, and device type. This generates training data for the AI to learn 
              your habits and make accurate predictions.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}