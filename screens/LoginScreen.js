import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";

// Enhanced input field component with Settings style
const InputField = React.memo(({
  icon,
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  secureTextEntry = false,
  keyboardType = "default",
  error,
  showError = true,
  rightIcon,
  fieldName,
  isLoading,
  isFocused,
  onFocus
}) => (
  <View style={styles.field}>
    <View style={styles.fieldHeader}>
      <MaterialIcons name={icon} size={20} color="#10b981" />
      <Text style={styles.fieldLabel}>{label}</Text>
    </View>
    <View style={styles.inputContainer}>
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && showError && styles.inputError,
          rightIcon && styles.inputWithIcon
        ]}
        placeholder={placeholder}
        placeholderTextColor="#6b7280"
        value={value}
        onChangeText={onChangeText}
        onFocus={() => onFocus(fieldName)}
        onBlur={() => onBlur(fieldName, value)}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isLoading}
        returnKeyType={label === "Email" ? "next" : "done"}
        blurOnSubmit={label !== "Email"}
      />
      {rightIcon && (
        <TouchableOpacity style={styles.inputIcon} onPress={rightIcon.onPress}>
          <MaterialIcons 
            name={rightIcon.iconName} 
            size={20} 
            color={isFocused ? "#10b981" : "#a1a1aa"} 
          />
        </TouchableOpacity>
      )}
    </View>
    {error && showError && (
      <Text style={styles.errorText}>{error}</Text>
    )}
  </View>
));

export default function LoginScreen() {
  const navigation = useNavigation();
  const { signIn, loading, profileLoading, user, userProfile } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Only navigate to Dashboard when login is explicitly successful
  useEffect(() => {
    if (loginSuccess && user && userProfile && !loading && !profileLoading) {
      navigation.replace("Dashboard");
    }
  }, [loginSuccess, user, userProfile, loading, profileLoading, navigation]);

  // Rate limiting: block after 5 failed attempts for 5 minutes
  useEffect(() => {
    if (attemptCount >= 5) {
      setIsBlocked(true);
      const timer = setTimeout(() => {
        setIsBlocked(false);
        setAttemptCount(0);
      }, 300000); // 5 minutes

      return () => clearTimeout(timer);
    }
  }, [attemptCount]);

  // Clear form data function
  const clearFormData = useCallback(() => {
    setFormData({
      email: "",
      password: "",
    });
    setErrors({});
    setTouched({});
    setShowPassword(false);
    setFocusedField(null);
  }, []);

  // Email validation with comprehensive regex
  const validateEmail = useCallback((email) => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!email.trim()) {
      return "Email is required";
    }

    if (email.length > 320) {
      return "Email is too long";
    }

    if (!emailRegex.test(email.trim())) {
      return "Please enter a valid email address";
    }

    return null;
  }, []);

  // Password validation - ONLY checks if password is provided
  const validatePassword = useCallback((password) => {
    if (!password) {
      return "Password is required";
    }

    return null;
  }, []);

  // Real-time validation
  const validateField = useCallback((field, value) => {
    let error = null;

    switch (field) {
      case "email":
        error = validateEmail(value);
        break;
      case "password":
        error = validatePassword(value);
        break;
      default:
        break;
    }

    setErrors(prev => ({
      ...prev,
      [field]: error
    }));

    return error === null;
  }, [validateEmail, validatePassword]);

  // Comprehensive form validation
  const validateForm = useCallback(() => {
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    const newErrors = {
      email: emailError,
      password: passwordError,
    };

    setErrors(newErrors);
    setTouched({ email: true, password: true });

    // Check if any errors exist
    const hasErrors = Object.values(newErrors).some(error => error !== null);

    if (hasErrors) {
      // Show first error in an alert
      const firstError = emailError || passwordError;
      Alert.alert("Validation Error", firstError);
      return false;
    }

    return true;
  }, [formData, validateEmail, validatePassword]);

  const handleSignIn = useCallback(async () => {
    if (isBlocked) {
      Alert.alert(
        "Account Temporarily Blocked",
        "Too many failed attempts. Please try again in 5 minutes."
      );
      return;
    }

    if (!validateForm()) return;

    try {
      const { data, error } = await signIn(
        formData.email.trim().toLowerCase(),
        formData.password
      );

      if (error) {
        // Authentication failed - increment attempt count and show error
        setAttemptCount(prev => prev + 1);
        setLoginSuccess(false); // Ensure login success is false

        let errorMessage = error.message;
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password. Please check your credentials and try again.";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Please verify your email address before signing in.";
        } else if (error.message.includes("Too many requests")) {
          errorMessage = "Too many sign-in attempts. Please wait a moment before trying again.";
        }

        // Clear form fields after failed authentication
        clearFormData();

        Alert.alert("Sign In Failed", errorMessage);
      } else if (data && data.user) {
        // Authentication successful
        setAttemptCount(0);
        setLoginSuccess(true); // Set login success to trigger navigation
      }
    } catch (err) {
      // Handle unexpected errors
      setAttemptCount(prev => prev + 1);
      setLoginSuccess(false);
      
      // Clear form fields after unexpected error
      clearFormData();
      
      Alert.alert("Sign In Failed", "An unexpected error occurred. Please try again.");
    }
  }, [formData, validateForm, signIn, isBlocked, clearFormData]);

  const handleEmailChange = useCallback((text) => {
    setFormData(prev => ({ ...prev, email: text }));
    // Clear login success when user starts typing again
    setLoginSuccess(false);
  }, []);

  const handlePasswordChange = useCallback((text) => {
    setFormData(prev => ({ ...prev, password: text }));
    // Clear login success when user starts typing again
    setLoginSuccess(false);
  }, []);

  const handleBlur = useCallback((field, value) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setFocusedField(null);
    validateField(field, value);
  }, [validateField]);

  const handleFocus = useCallback((field) => {
    setFocusedField(field);
  }, []);

  // Clear fields when blocked state changes
  useEffect(() => {
    if (isBlocked) {
      clearFormData();
    }
  }, [isBlocked, clearFormData]);

  const isLoading = loading || profileLoading;
  const isFormValid = formData.email.trim().length > 0 && formData.password.length > 0;

  // Loading overlay component
  const LoadingOverlay = () => (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>
          {loading ? "Signing you in..." : "Loading your profile..."}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0b" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to Home IQ</Text>
        </View>

        {/* Security warning for blocked accounts */}
        {attemptCount >= 3 && attemptCount < 5 && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              Warning: {5 - attemptCount} attempts remaining before temporary block
            </Text>
          </View>
        )}

        {isBlocked && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorContainerText}>
              Account temporarily blocked due to multiple failed attempts
            </Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          <InputField
            icon="email"
            label="Email"
            placeholder="john@example.com"
            value={formData.email}
            onChangeText={handleEmailChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            fieldName="email"
            keyboardType="email-address"
            error={errors.email}
            showError={touched.email}
            isFocused={focusedField === 'email'}
            isLoading={isLoading}
          />

          <InputField
            icon="lock"
            label="Password"
            placeholder="Enter your password"
            value={formData.password}
            onChangeText={handlePasswordChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            fieldName="password"
            secureTextEntry={!showPassword}
            error={errors.password}
            showError={touched.password}
            isFocused={focusedField === 'password'}
            rightIcon={{
              iconName: showPassword ? "visibility-off" : "visibility",
              onPress: () => setShowPassword(!showPassword)
            }}
            isLoading={isLoading}
          />

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('ForgotPassword')}
            disabled={isLoading}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            (isLoading || !isFormValid || isBlocked) && styles.submitBtnDisabled
          ]}
          onPress={handleSignIn}
          disabled={isLoading || !isFormValid || isBlocked}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitBtnText}>
              {isBlocked ? "Blocked" : "Sign In"}
            </Text>
          )}
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Signup')}
            disabled={isLoading}
          >
            <Text style={styles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {/* Loading Overlay */}
        {isLoading && <LoadingOverlay />}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ... (styles remain the same)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0b',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#a1a1aa',
  },
  form: {
    marginBottom: 24,
  },
  field: {
    marginBottom: 20,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#a1a1aa',
    fontWeight: '600',
    marginLeft: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  inputFocused: {
    borderColor: '#10b981',
    borderWidth: 2,
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  inputWithIcon: {
    paddingRight: 45,
  },
  inputIcon: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
    padding: 4,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  warningContainer: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderColor: '#fbbf24',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    color: '#fbbf24',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorContainerText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#10b981',
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 10, 11, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 32,
    paddingHorizontal: 48,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
});
