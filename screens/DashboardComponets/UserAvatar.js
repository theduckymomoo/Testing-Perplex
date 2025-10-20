import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

export const UserAvatar = ({ onPress }) => {
  const { user, userProfile } = useAuth();

  const initial = (
    userProfile?.first_name?.[0] ||
    user?.email?.[0]      ||
    'U'
  ).toUpperCase();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.container}>
      <LinearGradient
        colors={['#10b981', '#34d399']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Text style={styles.initial}>{initial}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  gradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
});