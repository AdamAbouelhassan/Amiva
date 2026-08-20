/**
 * Account creation / onboarding — functional_specification.md §7: name,
 * email, username, optional phone, optional profile photo, the 8 travel-
 * style sliders, and default privacy setting. Firebase Auth has already
 * run by the time this screen is reached (see RootNavigator) — this
 * screen creates the Firestore `users/{uid}` profile doc that the rest of
 * the app treats as "onboarding complete."
 */
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { TravelStyleVector, zeroTravelStyleVector } from '@amiva/core';
import { Button } from '../../../components/Button';
import { Privacy, PrivacyPicker } from '../../../components/PrivacyPicker';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TextField } from '../../../components/TextField';
import { TravelStyleSliders } from '../../../components/TravelStyleSliders';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { hashPhoneNumber } from '../../../lib/phoneHash';
import { compressAndUploadImage } from '../../../lib/uploadImage';
import { UserRepository } from '../../../repositories/userRepository';
import { colors, spacing, typography } from '../../../theme';

// Assumption: the spec doesn't state a default slider position — starting
// at the midpoint (5) rather than 0 avoids implying "no interest" in
// every category before the user has touched anything.
function initialTravelStyle(): TravelStyleVector {
  const zero = zeroTravelStyleVector();
  const midpoint = {} as TravelStyleVector;
  for (const key of Object.keys(zero) as (keyof TravelStyleVector)[]) midpoint[key] = 5;
  return midpoint;
}

export function OnboardingScreen() {
  const { firebaseUser, refetchProfile } = useCurrentUser();
  const [name, setName] = useState(firebaseUser?.displayName ?? '');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [privacySetting, setPrivacySetting] = useState<Privacy>('public');
  const [travelStyle, setTravelStyle] = useState<TravelStyleVector>(initialTravelStyle());
  const [photoUri, setPhotoUri] = useState<string | undefined>(firebaseUser?.photoURL ?? undefined);
  const [usernameError, setUsernameError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  }

  async function submit() {
    if (!firebaseUser) return;
    const trimmedUsername = username.trim().toLowerCase();
    if (!name.trim() || !trimmedUsername) {
      setUsernameError(!trimmedUsername ? 'Username is required.' : undefined);
      return;
    }

    setSubmitting(true);
    try {
      const existing = await UserRepository.getByUsername(trimmedUsername);
      if (existing) {
        setUsernameError('That username is taken.');
        return;
      }

      let profilePhotoUrl: string | undefined;
      // Only re-upload if it's a local file URI (not already a remote
      // OAuth-provider photo URL).
      if (photoUri && photoUri.startsWith('file:')) {
        profilePhotoUrl = await compressAndUploadImage(photoUri, `profilePhotos/${firebaseUser.uid}/photo.jpg`);
      } else {
        profilePhotoUrl = photoUri;
      }

      const trimmedPhone = phoneNumber.trim();
      await UserRepository.create({
        uid: firebaseUser.uid,
        username: trimmedUsername,
        name: name.trim(),
        email: firebaseUser.email ?? '',
        phoneNumber: trimmedPhone || undefined,
        phoneNumberHash: trimmedPhone ? await hashPhoneNumber(trimmedPhone) : undefined,
        profilePhotoUrl,
        privacySetting,
        travelStyle,
        travelStyleBaseline: travelStyle,
        travelStyleLastUpdated: new Date(),
        createdAt: new Date(),
        recentSearches: [],
      });

      await refetchProfile();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <View style={{ gap: spacing.xs }}>
        <Text style={typography.displayMd}>Set up your profile</Text>
        <Text style={typography.body}>This defines your starting travel style — you can always adjust it later.</Text>
      </View>

      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={{ width: 88, height: 88, borderRadius: 44 }} />
        ) : (
          <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.surfaceAlt }} />
        )}
        <Button label="Choose photo (optional)" variant="secondary" onPress={pickPhoto} />
      </View>

      <TextField label="Name" value={name} onChangeText={setName} placeholder="Your name" />
      <TextField
        label="Username"
        value={username}
        onChangeText={(text) => {
          setUsername(text);
          setUsernameError(undefined);
        }}
        placeholder="unique-username"
        autoCapitalize="none"
        error={usernameError}
      />
      <TextField
        label="Phone number (optional)"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        placeholder="Enables contacts-sync friend discovery"
        keyboardType="phone-pad"
      />

      <View style={{ gap: spacing.xs }}>
        <Text style={typography.subtitle}>Default privacy</Text>
        <PrivacyPicker value={privacySetting} onChange={setPrivacySetting} />
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={typography.subtitle}>Your travel style</Text>
        <TravelStyleSliders value={travelStyle} onChange={setTravelStyle} />
      </View>

      <Button label="Finish setup" onPress={submit} loading={submitting} />
    </ScreenContainer>
  );
}
