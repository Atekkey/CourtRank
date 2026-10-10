import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, TextInput, ActivityIndicator, Image, Modal, Linking } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getPlayerInfo, updateUserNames } from '../../services/firebaseService';
import { osName } from 'expo-device';
import { myPrint, privatePolicy } from '../helpers';
import { useTheme, useThemedStyles, ThemePreference } from '../../contexts/ThemeContext';
import { ThemeColors } from '../../constants/theme';

export default function MyProfile() {
  const { colors, preference, setPreference } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { user, userInfo, isLoading, logout } = useAuth();
  const [error, setError] = useState(null);

  const [showNotif, setShowNotif] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);
  const notifImplem = false;

  const hideAll = () => {
    setShowNotif(false);
    setShowHelp(false);
    setShowPrivacy(false);
    setShowEdit(false);
    setShowAppearance(false);
  };

  const toggleNotif = () => {
    hideAll();
    setShowNotif(!showNotif);
  };

  const toggleHelp = () => {
    hideAll();
    setShowHelp(!showHelp);
  };

  const togglePrivacy = () => {
    hideAll();
    setShowPrivacy(!showPrivacy);
  };

  const toggleEdit = () => {
    hideAll();
    setShowEdit(!showEdit);
  };

  const toggleAppearance = () => {
    hideAll();
    setShowAppearance(!showAppearance);
  };

  const [firstName, setFirstName] = useState(userInfo?.first_name || '');
  const [lastName, setLastName] = useState(userInfo?.last_name || '');
  // Edit Profile Component
  const editProfileComponent = (
    <View style={styles.inputGroup}>

      <View style={{marginTop : 10}}></View> {/* Spacer */}

      
      <View style={{ flexDirection: 'column', gap: 10 }}>

        <Text style={styles.inputLabel}>First Name</Text>
        <TextInput
          style={styles.textInput}
          value={firstName}
          onChangeText={(text) => setFirstName(text)}
          placeholder="First Name"
          maxLength={50}
        />

        <Text style={styles.inputLabel}>Last Name</Text>
        <TextInput
          style={styles.textInput}
          value={lastName}
          onChangeText={(text) => setLastName(text)}
          placeholder="Last Name"
          maxLength={50}
        />
        
        <TouchableOpacity
          style={styles.saveButton}
          onPress={async () => {
            // On Save Names
            if (!userInfo) {
              return;
            }
            const ret = await updateUserNames(user?.uid, firstName, lastName);
            
            if(!ret) {
              myPrint("Error updating names", "Error");
              return;
            }
            // Optimistic update
            userInfo.first_name = firstName;
            userInfo.last_name = lastName;

            myPrint(`First Name: ${firstName}\nLast Name: ${lastName}`, 'Profile Updated');
            toggleEdit();
          }}> 
            <Text style={styles.saveText}>Save Name</Text>
          </TouchableOpacity>
      </View>

    </View>


  );
  

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        logout();
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Sign Out', 
            style: 'destructive',
            onPress: async () => {
              try {
                await logout();
              } catch (error) {
                Alert.alert('Error', 'Failed to sign out. Please try again.');
              }
            }
          }
        ]
      );
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={styles.header}>
          <Text style={styles.title}>My Profile</Text>
        </View>
        <View style={[styles.profileCard, styles.centerContent]}>
          <ActivityIndicator size="large" color={colors.primaryText}/>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </ScrollView>
    );
  }

  // Show error state
  if (error) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={styles.header}>
          <Text style={styles.title}>My Profile</Text>
        </View>
        <View style={styles.profileCard}>
          <Text style={styles.errorText}>Error loading profile: {error}</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
      </View>
      
      <View style={styles.profileCard}>
        <View style={styles.profileImageContainer}>
                      {userInfo?.photo_URL ? (
                        <Image source={{ uri: userInfo.photo_URL}} style={styles.profileImage} />
                      ) : (
                        <View style={styles.profileImagePlaceholder}>
                          <Text style={styles.profileImageText}>
                            {userInfo?.first_name[0]}{userInfo?.last_name[0]}
                          </Text>
                        </View>
                      )}
              </View>
              <View style={styles.profileCardText}>
        <Text style={styles.playerName}>
          {userInfo?.first_name || "..."} {userInfo?.last_name || "..."}
        </Text>
        {user?.email && (
          <Text style={styles.playerEmail}>{user.email}</Text>
        )}
        </View>
      </View>
      
      <View style={styles.settingsCard}>
        <Text style={styles.cardTitle}>Settings</Text>
        <TouchableOpacity style={styles.settingItem} onPress={() => toggleEdit()}>
          <Text style={styles.settingText}>Edit Profile</Text>
        </TouchableOpacity>
        {showEdit && editProfileComponent}
        
        <TouchableOpacity style={styles.settingItem} onPress={() => toggleAppearance()}>
          <Text style={styles.settingText}>Appearance</Text>
        </TouchableOpacity>
          {showAppearance && (<View style={styles.themeOptions}>
            {(['system', 'light', 'dark'] as ThemePreference[]).map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.themeOption, preference === option && styles.themeOptionSelected]}
                onPress={() => setPreference(option)}
              >
                <Text style={[styles.themeOptionText, preference === option && styles.themeOptionTextSelected]}>
                  {option[0].toUpperCase() + option.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>)}

        
         {notifImplem && (<TouchableOpacity style={styles.settingItem} onPress={() => toggleNotif()}>
          <Text style={styles.settingText}>Notifications</Text>
          {showNotif && <Text style={[styles.settingSubtext, {marginTop: 10}]}>Yet to be implemented</Text>}
        </TouchableOpacity>)}
        <TouchableOpacity style={styles.settingItem} onPress={() => togglePrivacy()}>
          <Text style={styles.settingText}>Privacy Policy</Text>
          {showPrivacy && (
            (Platform.OS === 'web') ? (
              <View style={{ marginTop: 10 }}>
                {/* Only render raw HTML on web where div is supported */}
                <div dangerouslySetInnerHTML={{ __html: privatePolicy }} />
              </View>
            ) : (
              <TouchableOpacity onPress={() => Linking.openURL('https://www.privacypolicies.com/live/14338ca6-e95d-4764-85ff-338ef856452b')}>
                <Text style={[styles.settingSubtext, { marginTop: 10 }]}>View the privacy policy online</Text>
              </TouchableOpacity>
            )
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem} onPress={() => toggleHelp()}>
          <Text style={styles.settingText}>Help & Support</Text>
          {showHelp && 
          <TouchableOpacity onPress={() => Linking.openURL('mailto:courtrankhelp@gmail.com')}>
            <Text style={[styles.settingSubtext, {marginTop: 10}]}>Email courtrankhelp@gmail.com for assistance</Text>
          </TouchableOpacity>
          }
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    paddingTop: osName === 'iOS' ? 40 : 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: c.primaryText,
  },
  profileCard: {
    backgroundColor: c.card,
    margin: 15,
    padding: 20,
    borderRadius: 15,
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  profileCardText: {
    alignItems: 'flex-start',
    marginLeft: 15,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderColor: c.primary,
    borderWidth: 5,
  },
  profileImage: {
    width: '100%',
    height: '100%',    
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: c.primary ,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    color: c.onPrimary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: c.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: c.dangerText,
    textAlign: 'center',
  },
  playerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: c.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  playerLevel: {
    fontSize: 16,
    color: c.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  playerLocation: {
    fontSize: 16,
    color: c.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  playerEmail: {
    fontSize: 14,
    color: c.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  settingsCard: {
    backgroundColor: c.card,
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: c.divider,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '600',
    color: c.text,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  themeOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    alignItems: 'center',
  },
  themeOptionSelected: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: c.textSecondary,
  },
  themeOptionTextSelected: {
    color: c.onPrimary,
  },
  settingSubtext: {
    fontSize: 14,
    color: c.textSecondary,
  },
  logoutCard: {
    backgroundColor: c.card,
    margin: 15,
    marginBottom: 30,
    padding: 20,
    borderRadius: 10,
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButton: {
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    marginRight: 'auto',
    marginTop: 10,
  },
  logoutButtonText: {
    color: c.dangerText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: c.primaryText,
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    // fontWeight: '100',
    color: c.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: c.card,
    color: c.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: c.success,
    margin: 5,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cancelButton: {
    backgroundColor: c.textMuted,
    margin: 5,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveText: {
    color: c.onPrimary,
    fontSize: 20,
    // fontWeight: '100',
    // marginBottom: 8,
  },
});