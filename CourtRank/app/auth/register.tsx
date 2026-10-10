import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator, Image,
} from 'react-native';
import { router } from 'expo-router';
import { registerPlayer, useGoogleAuth } from '@/services/firebaseService';
import { Ionicons } from '@expo/vector-icons';

import { FcGoogle } from "react-icons/fc";
import { osName } from 'expo-device';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import { ThemeColors } from '../../constants/theme';




export default function RegisterScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { request, response, signInWithGoogle } = useGoogleAuth();

  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { firstName, lastName, email, password, confirmPassword } = formData;

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userData = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
      };

      await registerPlayer(formData.email.trim(), formData.password, userData);
      
      Alert.alert(
        'Success',
        'Account created successfully!',
        [
          {
            text: 'OK',
            // onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'An error occurred during registration';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please use a different email or try logging in.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      }
      
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      const user = await signInWithGoogle();
      console.log('Signed in as:', user.displayName);
      // router.replace('/(tabs)');
    } catch (error) {
      console.error('Google Sign-Up error:', error);
      Alert.alert('Sign-Up Failed', 'An error occurred during Google sign-up');
    } finally {
      setGoogleLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.replace('/auth/login');
  };

  const isFormDisabled = loading || googleLoading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={{flexDirection: 'row', alignItems: 'flex-end'}}>
          <Text style={styles.title}>Join</Text>
            <Image source={require('../../assets/images/CourtRankPodiumLogo.png')} style={styles.logoImage}></Image>
          </View>
          <Text style={styles.subtitle}>Create your account to start competing!</Text>
        </View>

        <View style={styles.formContainer}>
          {/* Google Sign-Up Button */}
          <TouchableOpacity
            style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
            onPress={handleGoogleSignUp}
            disabled={isFormDisabled}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color={colors.primaryText} />
            ) : (
              Platform.OS === 'web' ?
                (
                  <>
                    <FcGoogle name="logo-google" size={20} color={colors.primaryText} style={styles.googleIcon} />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="logo-google" size={20} color={colors.primaryText} style={styles.googleIcon} />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </>
                ) 
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.nameRow}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={styles.input}
                placeholder="First name"
                value={formData.firstName}
                onChangeText={(value) => handleInputChange('firstName', value)}
                autoCapitalize="words"
                placeholderTextColor={colors.textMuted}
                editable={!isFormDisabled}
              />
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Last name"
                value={formData.lastName}
                onChangeText={(value) => handleInputChange('lastName', value)}
                autoCapitalize="words"
                placeholderTextColor={colors.textMuted}
                editable={!isFormDisabled}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={colors.textMuted}
              editable={!isFormDisabled}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Create a password (min 6 characters)"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry
              autoCapitalize="none"
              placeholderTextColor={colors.textMuted}
              editable={!isFormDisabled}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              secureTextEntry
              autoCapitalize="none"
              placeholderTextColor={colors.textMuted}
              editable={!isFormDisabled}
            />
          </View>

          <TouchableOpacity
            style={[styles.registerButton, isFormDisabled && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isFormDisabled}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.registerButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginPrompt}>
            <Text style={styles.loginPromptText}>Already have an account? </Text>
            <TouchableOpacity onPress={navigateToLogin} disabled={isFormDisabled}>
              <Text style={[styles.loginLink, isFormDisabled && styles.disabledLink]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: osName === 'iOS' ? 40 : 20,
  },
  logoImage: {
    
    height: 80,
    width: 160,
    resizeMode: 'contain',

    
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: c.primaryText,
    marginBottom: 6,
    marginRight: -6,
  },
  subtitle: {
    fontSize: 18,
    color: c.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
  },
  formContainer: {
    backgroundColor: c.card,
    borderRadius: 20,
    padding: 25,
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
  googleButton: {
    backgroundColor: c.card,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: c.googleBorder,
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 20,
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    color: c.googleText,
    fontSize: 16,
    fontWeight: '500',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    marginBottom: 20,
  },
  halfWidth: {
    width: '47%',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: c.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: c.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: c.border,
    color: c.text,
  },
  registerButton: {
    backgroundColor: c.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: c.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: c.disabled,
    shadowOpacity: 0,
    borderColor: c.borderStrong,
  },
  registerButtonText: {
    color: c.onPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: c.border,
  },
  dividerText: {
    marginHorizontal: 15,
    color: c.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginPromptText: {
    fontSize: 16,
    color: c.textSecondary,
  },
  loginLink: {
    fontSize: 16,
    color: c.primaryText,
    fontWeight: '600',
  },
  disabledLink: {
    color: '#ccc',
  },
});