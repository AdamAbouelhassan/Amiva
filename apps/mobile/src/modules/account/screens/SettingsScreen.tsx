import * as ImagePicker from 'expo-image-picker';
import { signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Avatar } from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { Privacy, PrivacyPicker } from '../../../components/PrivacyPicker';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { Section } from '../../../components/Section';
import { TextField } from '../../../components/TextField';
import { auth } from '../../../firebase/client';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { hashPhoneNumber } from '../../../lib/phoneHash';
import { compressAndUploadImage } from '../../../lib/uploadImage';
import { UserRepository } from '../../../repositories/userRepository';
import { radius, spacing, useTheme, type ThemeMode } from '../../../theme';

interface SettingsScreenProps {
  navigation: { navigate: (screen: 'EditTravelStyle') => void };
}

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const t = useTheme();
  const { firebaseUser, profile, refetchProfile } = useCurrentUser();

  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [error, setError] = useState<string>();

  const [hydrated, setHydrated] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [nameError, setNameError] = useState<string>();
  const [usernameError, setUsernameError] = useState<string>();
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string>();
  const [profileSaved, setProfileSaved] = useState(false);

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
      <Text style={t.type.displayMd}>Settings</Text>

      <Section title="Profile">
        <Card padded>
          <View style={{ gap: spacing.sm }}>
            <View style={{ alignItems: 'center', gap: spacing.xs }}>
              <Avatar uri={photoUri} size={88} name={name} />
              <Button label="Change photo" variant="secondary" onPress={pickPhoto} />
            </View>
            <TextField
              label="Name"
              value={name}
              onChangeText={(x) => {
                setName(x);
                setNameError(undefined);
                setProfileSaved(false);
              }}
              error={nameError}
            />
            <TextField
              label="Username"
              value={username}
              onChangeText={(x) => {
                setUsername(x);
                setUsernameError(undefined);
                setProfileSaved(false);
              }}
              autoCapitalize="none"
              error={usernameError}
            />
            <TextField
              label="Phone number"
              value={phone}
              onChangeText={(x) => {
                setPhone(x);
                setProfileSaved(false);
              }}
              placeholder="Enables contacts-sync friend discovery"
              keyboardType="phone-pad"
            />
            <Button label="Save profile" onPress={saveProfile} loading={savingProfile} disabled={!hydrated} />
            {profileError ? (
              <Text style={[t.type.bodySmall, { color: t.colors.danger }]}>{profileError}</Text>
            ) : profileSaved ? (
              <Text style={[t.type.bodySmall, { color: t.colors.success }]}>Profile saved.</Text>
            ) : null}
          </View>
        </Card>
      </Section>

      <Section
        title="Privacy"
        hint="Controls who can see your Logbook, travel style, and trips — public, friends-only, or private."
      >
        {profile ? <PrivacyPicker value={profile.privacySetting} onChange={updatePrivacy} /> : null}
        {savingPrivacy ? <Text style={t.type.caption}>Saving…</Text> : null}
      </Section>

      <Section title="Appearance">
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          {THEME_OPTIONS.map((opt) => {
            const selected = t.mode === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => t.setMode(opt.value)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: spacing.xs,
                  borderRadius: radius.chip,
                  borderWidth: 1,
                  borderColor: selected ? t.colors.accent : t.colors.border,
                  backgroundColor: selected ? t.colors.accent : t.colors.surface,
                }}
              >
                <Text
                  style={[
                    t.type.label,
                    { color: selected ? t.colors.textOnAccent : t.colors.textSecondary },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Button label="Edit travel style" variant="secondary" onPress={() => navigation.navigate('EditTravelStyle')} />
      <Button label="Sign out" variant="secondary" onPress={() => signOut(auth)} />

      {error ? <Text style={[t.type.bodySmall, { color: t.colors.danger }]}>{error}</Text> : null}
    </ScreenContainer>
  );
}
