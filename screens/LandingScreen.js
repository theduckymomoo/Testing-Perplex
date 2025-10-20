import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  Image, 
  StatusBar,
  SafeAreaView,
  Dimensions,
  Animated,
  ScrollView,
  Vibration,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export default function LandingScreen() {
  const navigation = useNavigation();
  const [panicPressed, setPanicPressed] = useState(false);
  const [firePressed, setFirePressed] = useState(false);
  const [medicalPressed, setMedicalPressed] = useState(false);
  const [emergencyVisible, setEmergencyVisible] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for emergency section
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleEmergency = (type) => {
    let setPressed, message, contacts;
    
    switch(type) {
      case 'panic':
        if (panicPressed) return;
        setPressed = setPanicPressed;
        message = 'Emergency Alert Sent';
        contacts = 'Your trusted contacts and emergency services have been notified';
        break;
      case 'fire':
        if (firePressed) return;
        setPressed = setFirePressed;
        message = 'Fire Alert Sent';
        contacts = 'Fire department and emergency contacts notified';
        break;
      case 'medical':
        if (medicalPressed) return;
        setPressed = setMedicalPressed;
        message = 'Medical Alert Sent';
        contacts = 'Medical emergency services and contacts notified';
        break;
    }

    // Haptic feedback
    Vibration.vibrate([100, 50, 100]);
    
    setPressed(true);
    
    // Simulate emergency response
    setTimeout(() => {
      Alert.alert(
        message, 
        contacts,
        [
          {
            text: 'OK',
            style: 'default',
          },
          {
            text: 'Call Now',
            style: 'destructive',
            onPress: () => console.log('Calling emergency services...'),
          },
        ]
      );
      setPressed(false);
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0b" />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Animated.View 
          style={[
            styles.header, 
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/logo.png')} 
              style={styles.logo} 
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>Home IQ</Text>
          <Text style={styles.tagline}>Smart Living, Secure Future</Text>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View 
          style={[
            styles.statsContainer,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>50K+</Text>
            <Text style={styles.statLabel}>Homes Protected</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>24/7</Text>
            <Text style={styles.statLabel}>Monitoring</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>30s</Text>
            <Text style={styles.statLabel}>Response Time</Text>
          </View>
        </Animated.View>

        {/* Emergency Controls */}
        <Animated.View 
          style={[
            styles.emergencySection,
            { 
              opacity: fadeAnim,
              transform: [{ scale: emergencyVisible ? pulseAnim : 1 }]
            }
          ]}
        >
          <TouchableOpacity
            onPress={() => setEmergencyVisible(!emergencyVisible)}
            style={styles.emergencyHeader}
          >
            <Text style={styles.emergencyTitle}>Emergency Response</Text>
            <Text style={styles.emergencyToggle}>
              {emergencyVisible ? '▼' : '▶'} Tap to {emergencyVisible ? 'hide' : 'show'}
            </Text>
          </TouchableOpacity>
          
          {emergencyVisible && (
            <Animated.View style={styles.emergencyButtons}>
              <TouchableOpacity
                onPress={() => handleEmergency('panic')}
                disabled={panicPressed}
                style={[styles.emergencyBtn, styles.panicBtn, panicPressed && styles.loading]}
                activeOpacity={0.7}
              >
                <Text style={styles.emergencyIcon}>🚨</Text>
                <Text style={styles.emergencyText}>
                  {panicPressed ? 'SENDING...' : 'PANIC'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleEmergency('fire')}
                disabled={firePressed}
                style={[styles.emergencyBtn, styles.fireBtn, firePressed && styles.loading]}
                activeOpacity={0.7}
              >
                <Text style={styles.emergencyIcon}>🔥</Text>
                <Text style={styles.emergencyText}>
                  {firePressed ? 'SENDING...' : 'FIRE'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleEmergency('medical')}
                disabled={medicalPressed}
                style={[styles.emergencyBtn, styles.medicalBtn, medicalPressed && styles.loading]}
                activeOpacity={0.7}
              >
                <Text style={styles.emergencyIcon}>⚕️</Text>
                <Text style={styles.emergencyText}>
                  {medicalPressed ? 'SENDING...' : 'MEDICAL'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>

        {/* Main Content */}
        <Animated.View 
          style={[
            styles.main,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.heroTitle}>
            Control Your Home{'\n'}From Anywhere
          </Text>
          <Text style={styles.heroSubtitle}>
            Experience the future of home automation with intelligent monitoring, 
            instant emergency response, and complete peace of mind.
          </Text>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View 
          style={[
            styles.actions,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>Sign In to Your Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Signup')}
            style={styles.secondaryBtn}
          >
            <Text style={styles.secondaryBtnText}>Create Account</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0b',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 100,
    height: 100,
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#10b981',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#a1a1aa',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
  },
  emergencySection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emergencyHeader: {
    alignItems: 'center',
  },
  emergencyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emergencyToggle: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  emergencyButtons: {
    marginTop: 16,
    gap: 12,
  },
  emergencyBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  panicBtn: {
    backgroundColor: '#ef4444',
  },
  fireBtn: {
    backgroundColor: '#f59e0b',
  },
  medicalBtn: {
    backgroundColor: '#8b5cf6',
  },
  loading: {
    opacity: 0.7,
  },
  emergencyIcon: {
    fontSize: 16,
  },
  emergencyText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  main: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 32,
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 46,
    marginBottom: 16,
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  actions: {
    gap: 16,
  },
  primaryBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  secondaryBtn: {
    borderWidth: 2,
    borderColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  secondaryBtnText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '700',
  },
  tertiaryBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  tertiaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});