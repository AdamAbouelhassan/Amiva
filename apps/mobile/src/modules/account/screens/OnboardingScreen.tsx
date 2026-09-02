/**
 * Account creation / onboarding — functional_specification.md §7. Firebase
 * Auth has already run (see RootNavigator); this screen creates the
 * Firestore `users/{uid}` profile doc that marks onboarding complete.
 *
 * Flow (brief §3.1): capture the travel-style sliders FIRST with a live
 * radar that morphs as you drag, then a full-screen reveal of the finished
 * shape, then the profile fields — so the core mechanic clicks before any
 * form-filling. 19 sliders as of the taxonomy migration (2026-09-02, was
 * 8) — same flow, wider (docs/claude_code_prompt_taxonomy_migration.md
 * instruction #2).
 */
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { TravelStyleVector, zeroTravelStyleVector } from '@amiva/core';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { Avatar } from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import { Privacy, PrivacyPicker } from '../../../components/PrivacyPicker';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TextField } from '../../../components/TextField';
import { TravelStyleRadar } from '../../../components/TravelStyleRadar';
import { TravelStyleSliders } from '../../../components/TravelStyleSliders';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { hashPhoneNumber } from '../../../lib/phoneHash';
import { compressAndUploadImage } from '../../../lib/uploadImage';
import { UserRepository } from '../../../repositories/userRepository';
import { spacing, useTheme } from '../../../theme';

function initialTravelStyle(): TravelStyleVector {
  const zero = zeroTravelStyleVector();
  const mid = {} as TravelStyleVector;
  for (const key of Object.keys(zero) as (keyof TravelStyleVector)[]) mid[key] = 5;
  return mid;
}

type Step = 'style' | 'reveal' | 'profile';

export function OnboardingScreen() {
  const t = useTheme();
  const reduced = useReducedMotion();
  const { firebaseUser, refetchProfile } = useCurrentUser();

  const [step, setStep] = useState<Step>('style');
  const [travelStyle, setTravelStyle] = useState<TravelStyleVector>(initialTravelStyle());
  const [name, setName] = useState(firebaseUser?.displayName ?? '');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [privacySetting, setPrivacySetting] = useState<Privacy>('public');
  const [photoUri, setPhotoUri] = useState<string | undefined>(firebaseUser?.photoURL ?? undefined);
  const [nameError, setNameError] = useState<string>();
  const [usernameError, setUsernameError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  }

  async function submit() {
    if (!firebaseUser) return;
    setFormError(undefined);
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedName = name.trim();
    setNameError(trimmedName ? undefined : 'Name is required.');
    setUsernameError(trimmedUsername ? undefined : 'Username is required.');
    if (!trimmedName || !trimmedUsername) return;

    setSubmitting(true);
    try {
      if (await UserRepository.isUsernameTaken(trimmedUsername)) {
        setUsernameError('That username is taken.');
        return;
      }
      let profilePhotoUrl: string | undefined;
      if (photoUri && photoUri.startsWith('file:')) {
        profilePhotoUrl = await compressAndUploadImage(photoUri, `profilePhotos/${firebaseUser.uid}/photo.jpg`);
      } else {
        profilePhotoUrl = photoUri;
      }
      const trimmedPhone = phoneNumber.trim();
      await UserRepository.create({
        uid: firebaseUser.uid,
        username: trimmedUsername,
        name: trimmedName,
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
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 'reveal') {
    return (
      <ScreenContainer safeAreaTop scroll={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.lg }}>
          <Text style={[t.type.title, { textAlign: 'center' }]}>This is your travel style</Text>
          <Animated.View entering={reduced ? undefined : ZoomIn.duration(420)}>
            <TravelStyleRadar series={[{ vector: travelStyle }]} highlightTop size={300} />
          </Animated.View>
          <Animated.Text
            entering={reduced ? undefined : FadeInDown.delay(300)}
            style={[t.type.body, { color: t.colors.textSecondary, textAlign: 'center' }]}
          >
            Your shape shifts over time as you log and save experiences — you can always retune it.
          </Animated.Text>
          <Button label="Continue" onPress={() => setStep('profile')} style={{ alignSelf: 'stretch' }} />
        </View>
      </ScreenContainer>
    );
  }

  if (step === 'profile') {
    return (
      <ScreenContainer safeAreaTop>
        <Text style={t.type.displayMd}>Your profile</Text>

        <View style={{ alignItems: 'center', gap: spacing.sm }}>
          <Avatar uri={photoUri} size={88} name={name} />
          <Button label="Choose photo (optional)" variant="secondary" onPress={pickPhoto} />
        </View>

        <TextField
          label="Name"
          value={name}
          onChangeText={(x) => {
            setName(x);
            setNameError(undefined);
          }}
          placeholder="Your name"
          error={nameError}
        />
        <TextField
          label="Username"
          value={username}
          onChangeText={(x) => {
            setUsername(x);
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
          <Text style={t.type.subtitle}>Default privacy</Text>
          <PrivacyPicker value={privacySetting} onChange={setPrivacySetting} />
        </View>

        {formError ? <Text style={[t.type.bodySmall, { color: t.colors.danger }]}>{formError}</Text> : null}

        <Button label="Finish setup" onPress={submit} loading={submitting} />
      </ScreenContainer>
    );
  }

  // step === 'style'
  return (
    <ScreenContainer safeAreaTop>
      <View style={{ gap: spacing.xs }}>
        <Text style={t.type.displayMd}>What's your travel style?</Text>
        <Text style={[t.type.body, { color: t.colors.textSecondary }]}>
          Slide each dimension. Your shape forms as you go.
        </Text>
      </View>

      <View style={{ alignItems: 'center' }}>
        <TravelStyleRadar series={[{ vector: travelStyle }]} size={220} showLabels={false} />
      </View>

      <TravelStyleSliders value={travelStyle} onChange={setTravelStyle} />

      <Button label="See my shape" onPress={() => setStep('reveal')} />
    </ScreenContainer>
  );
}
