import * as ImagePicker from 'expo-image-picker';
import { signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Avatar } from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import { Privacy, PrivacyPicker } from '../../../components/PrivacyPicker';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TextField } from '../../../components/TextField';
import { auth } from '../../../firebase/client';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { hashPhoneNumber } from '../../../lib/phoneHash';
import { compressAndUploadImage } from '../../../lib/uploadImage';
import { UserRepository } from '../../../repositories/userRepository';
import { colors, spacing, typography } from '../../../theme';

interface SettingsScreenProps {
  navigation: { navigate: (screen: 'EditTravelStyle') => void };
}

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { firebaseUser, profile, refetchProfile } = useCurrentUser();

  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // --- editable profile fields ---------------------------------------------
  const [hydrated, setHydrated] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [nameError, setNameError] = useState<string | undefined>();
  const [usernameError, setUsernameError] = useState<string | undefined>();
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | undefined>();
  const [profileSaved, setProfileSaved] = useState(false);

  // profile can resolve after this screen mounts — seed the form once,
  // and don't clobber in-progress edits on later refetches.
  useEffect(() => {
    if (profile && !hydrated) {
      setName(profile.name);
      setUsername(profile.username);
      setPhone(profile.phoneNumber ?? '');
      setPhotoUri(profile.profilePhotoUrl);
      setHydrated(true);
    }
  }, [profile, hydrated]);

  async function updatePrivacy(next: Privacy) {
    if (!firebaseUser) return;
    setSavingPrivacy(true);
    setError(undefined);
    try {
      await UserRepository.updatePrivacySetting(firebaseUser.uid, next);
      await refetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingPrivacy(false);
    }
  }

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setProfileSaved(false);
    }
  }

  async function saveProfile() {
    if (!firebaseUser || !profile) return;
    setProfileError(undefined);
    setProfileSaved(false);

    const trimmedName = name.trim();
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedPhone = phone.trim();
    setNameError(trimmedName ? undefined : 'Name is required.');
    setUsernameError(trimmedUsername ? undefined : 'Username is required.');
    if (!trimmedName || !trimmedUsername) return;

    setSavingProfile(true);
    try {
      if (trimmedUsername !== profile.username) {
        if (await UserRepository.isUsernameTaken(trimmedUsername)) {
          setUsernameError('That username is taken.');
          return;
        }
        await UserRepository.changeUsername(firebaseUser.uid, profile.username, trimmedUsername);
      }

      const patch: Parameters<typeof UserRepository.updateProfile>[1] = {};
      if (trimmedName !== profile.name) patch.name = trimmedName;
      if (photoUri && photoUri.startsWith('file:')) {
        patch.profilePhotoUrl = await compressAndUploadImage(
          photoUri,
          `profilePhotos/${firebaseUser.uid}/photo.jpg`,
        );
      }
      if (trimmedPhone !== (profile.phoneNumber ?? '')) {
        patch.phoneNumber = trimmedPhone || null;
        patch.phoneNumberHash = trimmedPhone ? await hashPhoneNumber(trimmedPhone) : null;
      }
      await UserRepository.updateProfile(firebaseUser.uid, patch);

      await refetchProfile();
      setProfileSaved(true);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <ScreenContainer>
      <Text style={typography.displayMd}>Settings</Text>

      <View style={{ gap: spacing.sm }}>
        <Text style={typography.subtitle}>Profile</Text>

        <View style={{ alignItems: 'center', gap: spacing.xs }}>
          <Avatar uri={photoUri} size={88} />
          <Button label="Change photo" variant="secondary" onPress={pickPhoto} />
        </View>

        <TextField
          label="Name"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setNameError(undefined);
            setProfileSaved(false);
          }}
          error={nameError}
        />
        <TextField
          label="Username"
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            setUsernameError(undefined);
            setProfileSaved(false);
          }}
          autoCapitalize="none"
          error={usernameError}
        />
        <TextField
          label="Phone number"
          value={phone}
          onChangeText={(text) => {
            setPhone(text);
            setProfileSaved(false);
          }}
          placeholder="Enables contacts-sync friend discovery"
          keyboardType="phone-pad"
        />

        <Button label="Save profile" onPress={saveProfile} loading={savingProfile} disabled={!hydrated} />
        {profileError ? (
          <Text style={[typography.bodySmall, { color: colors.danger }]}>{profileError}</Text>
        ) : profileSaved ? (
          <Text style={[typography.bodySmall, { color: colors.success }]}>Profile saved.</Text>
        ) : null}
      </View>

      <View style={{ gap: spacing.xs }}>
        <Text style={typography.subtitle}>Privacy</Text>
        <Text style={typography.bodySmall}>
          Controls who can see your Logbook, travel style matrix, and trips — public, friends-only, or private.
        </Text>
        {profile ? <PrivacyPicker value={profile.privacySetting} onChange={updatePrivacy} /> : null}
        {savingPrivacy ? <Text style={typography.caption}>Saving…</Text> : null}
      </View>

      <Button label="Edit travel style" variant="secondary" onPress={() => navigation.navigate('EditTravelStyle')} />

      <Button label="Sign out" variant="secondary" onPress={() => signOut(auth)} />

      {error ? <Text style={[typography.bodySmall, { color: colors.danger }]}>{error}</Text> : null}
    </ScreenContainer>
  );
}
