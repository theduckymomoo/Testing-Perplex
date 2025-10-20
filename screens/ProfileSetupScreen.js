import React, { useState, useCallback } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ScrollView,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Animated,
} from "react-native";
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

// Custom Success Modal Component
const SuccessModal = ({ visible, onClose, title, message, buttonText = "Continue" }) => {
  const scaleValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      scaleValue.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={modalStyles.modalOverlay}>
        <Animated.View 
          style={[
            modalStyles.modalContent,
            { transform: [{ scale: scaleValue }] }
          ]}
        >
          {/* Success Icon */}
          <View style={modalStyles.iconContainer}>
            <View style={modalStyles.checkmarkCircle}>
              <Text style={modalStyles.checkmark}>✓</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={modalStyles.modalTitle}>{title}</Text>

          {/* Message */}
          <Text style={modalStyles.modalMessage}>{message}</Text>

          {/* Button */}
          <TouchableOpacity 
            style={modalStyles.modalButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={modalStyles.modalButtonText}>{buttonText}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Validation utility functions
const validationRules = {
 phone: (phone) => {
    const phoneRegex = /^[\+]?[0-9][\d\s\-\(\)\.]{6,20}$/;
    if (!phone.trim()) return "Phone number is required";
    const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
    if (!/^[\+]?[0-9]|^0[0-9]/.test(cleanPhone)) {
      return "Please enter a valid phone number";
    }
    if (cleanPhone.length < 7) return "Phone number is too short";
    if (cleanPhone.length > 17) return "Phone number is too long";
    if (!phoneRegex.test(phone)) return "Please enter a valid phone number";
    return null;
  },
  
  name: (name, fieldName) => {
    if (!name.trim()) return `${fieldName} is required`;
    if (name.trim().length < 2) return `${fieldName} must be at least 2 characters`;
    if (!/^[a-zA-Z\s]+$/.test(name)) return `${fieldName} should only contain letters`;
    return null;
  },
  
  address: (address) => {
    if (!address.trim()) return "Address is required";
    if (address.trim().length < 5) return "Please enter a complete address";
    return null;
  }
};

const InputField = ({ 
  label, 
  placeholder, 
  value, 
  onChangeText, 
  keyboardType = "default", 
  isLoading,
  error,
  onBlur,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        error && styles.inputContainerError,
      ]}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#6b7280"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur && onBlur();
          }}
          keyboardType={keyboardType}
          autoCapitalize="words"
          autoCorrect={false}
          editable={!isLoading}
        />
      </View>
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

export default function ProfileSetupScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    emergencyName: "",
    emergencyPhone: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const updateForm = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  const validateField = useCallback((field, value) => {
    let error = null;
    
    switch (field) {
      case 'firstName':
        error = validationRules.name(value, 'First name');
        break;
      case 'lastName':
        error = validationRules.name(value, 'Last name');
        break;
      case 'phone':
        error = validationRules.phone(value);
        break;
      case 'address':
        error = validationRules.address(value);
        break;
      case 'emergencyName':
        error = validationRules.name(value, 'Emergency contact name');
        break;
      case 'emergencyPhone':
        error = validationRules.phone(value);
        break;
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === null;
  }, []);

  const handleFieldBlur = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  }, [formData, validateField]);

  const validateAllFields = useCallback(() => {
    const fields = Object.keys(formData);
    let isValid = true;
    const newErrors = {};
    
    fields.forEach(field => {
      const fieldIsValid = validateField(field, formData[field]);
      if (!fieldIsValid) {
        isValid = false;
        newErrors[field] = errors[field];
      }
    });
    
    setErrors(prev => ({ ...prev, ...newErrors }));
    setTouched(fields.reduce((acc, field) => ({ ...acc, [field]: true }), {}));
    
    return isValid;
  }, [formData, validateField, errors]);

  const isFormValid = Object.values(formData).every(value => value.trim() !== '') &&
                      Object.values(errors).every(error => error === null);

  const handleComplete = useCallback(async () => {
    if (!validateAllFields()) {
      Alert.alert("Validation Error", "Please fix all errors before submitting");
      return;
    }
    
    setIsLoading(true);
    
    const profileData = {
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      phone: formData.phone.replace(/[\s\-\(\)\.]/g, ''),
      address: formData.address.trim(),
      emergency_contact: formData.emergencyName.trim(),
      emergency_phone: formData.emergencyPhone.replace(/[\s\-\(\)\.]/g, ''),
    };

    const { error } = await updateProfile(profileData);
    
    setIsLoading(false);
    
    if (error) {
      Alert.alert("Update Failed", error.message);
    } else {
      // Show success modal instead of default Alert
      setShowSuccessModal(true);
    }
  }, [formData, validateAllFields, updateProfile]);

  const handleModalClose = useCallback(() => {
    setShowSuccessModal(false);
    navigation.navigate('Login');
  }, [navigation]);

  const handleSkip = useCallback(() => {
    Alert.alert(
      "Skip Profile Setup?",
      "You can complete your profile later from settings, but some features may be limited.",
      [
        { text: "Go Back", style: "cancel" },
        { 
          text: "Skip for Now", 
          onPress: () => navigation.navigate('Login'),
          style: "destructive"
        }
      ]
    );
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0b" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
            <Text style={styles.title}>Almost There!</Text>
            <Text style={styles.subtitle}>
              Complete your profile to get the most out of Home IQ
            </Text>
          </View>

          {/* Personal Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.row}>
              <View style={styles.half}>
                <InputField
                  label="First Name"
                  placeholder="John"
                  value={formData.firstName}
                  onChangeText={(value) => updateForm('firstName', value)}
                  onBlur={() => handleFieldBlur('firstName')}
                  error={touched.firstName ? errors.firstName : null}
                  isLoading={isLoading}
                />
              </View>
              <View style={styles.half}>
                <InputField
                  label="Last Name"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChangeText={(value) => updateForm('lastName', value)}
                  onBlur={() => handleFieldBlur('lastName')}
                  error={touched.lastName ? errors.lastName : null}
                  isLoading={isLoading}
                />
              </View>
            </View>

            <InputField
              label="Phone Number"
              placeholder="+1 123 456 7890"
              value={formData.phone}
              onChangeText={(value) => updateForm('phone', value)}
              onBlur={() => handleFieldBlur('phone')}
              keyboardType="phone-pad"
              error={touched.phone ? errors.phone : null}
              isLoading={isLoading}
            />

            <InputField
              label="Address"
              placeholder="123 Main Street, City, Province"
              value={formData.address}
              onChangeText={(value) => updateForm('address', value)}
              onBlur={() => handleFieldBlur('address')}
              error={touched.address ? errors.address : null}
              isLoading={isLoading}
            />
          </View>

          {/* Emergency Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            
            <InputField
              label="Contact Name"
              placeholder="Jane Doe"
              value={formData.emergencyName}
              onChangeText={(value) => updateForm('emergencyName', value)}
              onBlur={() => handleFieldBlur('emergencyName')}
              error={touched.emergencyName ? errors.emergencyName : null}
              isLoading={isLoading}
            />

            <InputField
              label="Contact Phone"
              placeholder="+1 123 456 7890"
              value={formData.emergencyPhone}
              onChangeText={(value) => updateForm('emergencyPhone', value)}
              onBlur={() => handleFieldBlur('emergencyPhone')}
              keyboardType="phone-pad"
              error={touched.emergencyPhone ? errors.emergencyPhone : null}
              isLoading={isLoading}
            />
          </View>

          {/* Buttons */}
          <TouchableOpacity 
            style={[
              styles.submitBtn,
              (isLoading || !isFormValid) && styles.submitBtnDisabled
            ]} 
            onPress={handleComplete}
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>Complete Profile</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.skipBtn}
            onPress={handleSkip}
            disabled={isLoading}
          >
            <Text style={styles.skipBtnText}>Skip for Now</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        onClose={handleModalClose}
        title="Profile Complete! 🎉"
        message="Your account is now fully set up. Please check your email to verify your account."
        buttonText="Go to Login"
      />
    </SafeAreaView>
  );
}

const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1a1a1b',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 24,
  },
  checkmarkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 3,
    borderColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 42,
    color: '#10b981',
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#a1a1aa',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 24,
  },
  modalButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0b',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 9999,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressFill: {
    width: '50%',
    height: '100%',
    backgroundColor: '#10b981',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#a1a1aa',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    height: 50,
  },
  inputContainerFocused: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  inputContainerError: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  submitBtn: {
    backgroundColor: '#10b981',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  skipBtn: {
    backgroundColor: 'transparent',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipBtnText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
});