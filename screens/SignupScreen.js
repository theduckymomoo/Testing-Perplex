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
  Image,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Animated,
} from "react-native";
import { useNavigation } from '@react-navigation/native';
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
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return null;
  },
  
  password: (password) => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/(?=.*[a-z])/.test(password)) return "Password must contain at least one lowercase letter";
    if (!/(?=.*[A-Z])/.test(password)) return "Password must contain at least one uppercase letter";
    if (!/(?=.*\d)/.test(password)) return "Password must contain at least one number";
    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) return "Password must contain at least one special character";
    return null;
  },
  
  confirmPassword: (password, confirmPassword) => {
    if (!confirmPassword) return "Please confirm your password";
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
  },
};

const InputField = ({ 
  label, 
  placeholder, 
  value, 
  onChangeText, 
  secureTextEntry = false, 
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
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={secureTextEntry ? "none" : "none"}
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

export default function SignupScreen() {
  const navigation = useNavigation();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
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
      case 'email':
        error = validationRules.email(value);
        break;
      case 'password':
        error = validationRules.password(value);
        break;
      case 'confirmPassword':
        error = validationRules.confirmPassword(formData.password, value);
        break;
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === null;
  }, [formData.password]);

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

  const handleSignup = useCallback(async () => {
    if (!validateAllFields()) {
      Alert.alert("Validation Error", "Please fix all errors before submitting");
      return;
    }
    
    setIsLoading(true);
    
    // Create account with minimal data
    const { data, error } = await signUp(
      formData.email.trim().toLowerCase(), 
      formData.password,
      {} // Empty additional data - will be collected in ProfileSetup
    );
    
    setIsLoading(false);
    
    if (error) {
      Alert.alert("Registration Failed", error.message);
    } else {
      // Show success modal instead of default Alert
      setShowSuccessModal(true);
    }
  }, [formData, validateAllFields, signUp]);

  const handleModalClose = useCallback(() => {
    setShowSuccessModal(false);
    // Navigate to profile setup screen
    navigation.navigate('ProfileSetup', { 
      email: formData.email.trim().toLowerCase() 
    });
  }, [navigation, formData.email]);

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
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/logo.png')} 
                style={styles.logo} 
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join Home IQ today and get started in seconds
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <InputField
              label="Email Address"
              placeholder="john@example.com"
              value={formData.email}
              onChangeText={(value) => updateForm('email', value)}
              onBlur={() => handleFieldBlur('email')}
              keyboardType="email-address"
              error={touched.email ? errors.email : null}
              isLoading={isLoading}
            />

            <InputField
              label="Password"
              placeholder="Minimum 8 characters"
              value={formData.password}
              onChangeText={(value) => updateForm('password', value)}
              onBlur={() => handleFieldBlur('password')}
              secureTextEntry
              error={touched.password ? errors.password : null}
              isLoading={isLoading}
            />

            <InputField
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChangeText={(value) => updateForm('confirmPassword', value)}
              onBlur={() => handleFieldBlur('confirmPassword')}
              secureTextEntry
              error={touched.confirmPassword ? errors.confirmPassword : null}
              isLoading={isLoading}
            />

            {/* Password Requirements */}
            {formData.password && (
              <View style={styles.passwordRequirements}>
                <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                <View style={styles.requirementRow}>
                  <View style={[
                    styles.checkmark, 
                    formData.password.length >= 8 && styles.checkmarkMet
                  ]} />
                  <Text style={[
                    styles.requirement, 
                    formData.password.length >= 8 && styles.requirementMet
                  ]}>
                    At least 8 characters
                  </Text>
                </View>
                <View style={styles.requirementRow}>
                  <View style={[
                    styles.checkmark, 
                    /(?=.*[a-z])/.test(formData.password) && styles.checkmarkMet
                  ]} />
                  <Text style={[
                    styles.requirement, 
                    /(?=.*[a-z])/.test(formData.password) && styles.requirementMet
                  ]}>
                    One lowercase letter
                  </Text>
                </View>
                <View style={styles.requirementRow}>
                  <View style={[
                    styles.checkmark, 
                    /(?=.*[A-Z])/.test(formData.password) && styles.checkmarkMet
                  ]} />
                  <Text style={[
                    styles.requirement, 
                    /(?=.*[A-Z])/.test(formData.password) && styles.requirementMet
                  ]}>
                    One uppercase letter
                  </Text>
                </View>
                <View style={styles.requirementRow}>
                  <View style={[
                    styles.checkmark, 
                    /(?=.*\d)/.test(formData.password) && styles.checkmarkMet
                  ]} />
                  <Text style={[
                    styles.requirement, 
                    /(?=.*\d)/.test(formData.password) && styles.requirementMet
                  ]}>
                    One number
                  </Text>
                </View>
                <View style={styles.requirementRow}>
                  <View style={[
                    styles.checkmark, 
                    /(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(formData.password) && styles.checkmarkMet
                  ]} />
                  <Text style={[
                    styles.requirement, 
                    /(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(formData.password) && styles.requirementMet
                  ]}>
                    One special character
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[
              styles.submitBtn,
              (isLoading || !isFormValid) && styles.submitBtnDisabled
            ]} 
            onPress={handleSignup}
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')}
              disabled={isLoading}
            >
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        onClose={handleModalClose}
        title="Account Created! 🎉"
        message="Welcome to Home IQ! Let's complete your profile to get you started."
        buttonText="Complete Profile"
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
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  logo: {
    width: 45,
    height: 45,
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
  formSection: {
    marginBottom: 24,
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
  passwordRequirements: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a1a1aa',
    marginBottom: 6,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkmark: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#6b7280',
    marginRight: 8,
  },
  checkmarkMet: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  requirement: {
    fontSize: 12,
    color: '#6b7280',
  },
  requirementMet: {
    color: '#10b981',
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: '#10b981',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#a1a1aa',
    fontSize: 16,
  },
  footerLink: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '700',
  },
});