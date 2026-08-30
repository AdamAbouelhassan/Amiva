import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '../../../components/Button';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TextField } from '../../../components/TextField';
import { colors, spacing, typography } from '../../../theme';
import { useEmailPasswordAuth } from '../hooks/useEmailPasswordAuth';
import { useFacebookSignIn } from '../hooks/useFacebookSignIn';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn';

export function SignInScreen() {
  const google = useGoogleSignIn();
  const facebook = useFacebookSignIn();
  const emailPassword = useEmailPasswordAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const error = google.error ?? facebook.error ?? emailPassword.error;

  return (
    <ScreenContainer>
      <View style={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.xs }}>
          <Text style={typography.displayLg}>Amiva</Text>
          <Text style={typography.body}>Log your travels, discover your style, find your people.</Text>
        </View>

        <View style={{ gap: spacing.sm }}>
          <Button label="Continue with Google" onPress={google.signIn} loading={google.signingIn} disabled={!google.ready} />
          <Button
            label="Continue with Facebook"
            variant="secondary"
            onPress={facebook.signIn}
            loading={facebook.signingIn}
            disabled={!facebook.ready}
          />
        </View>

        {/*
          Email/password — functional_specification.md §7's account table
          lists "Password (Required if not OAuth)", so this is a spec-
          anticipated path, not scaffolding bolted on outside the spec.
          Also useful right now because it needs no external redirect at
          all, unlike Google/Facebook above (see docs/expo_go_testing_todo.md
          for the Expo-Go-vs-OAuth-redirect-URI issue those are blocked on).
        */}
        <View style={{ gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.lg }}>
          <Text style={typography.subtitle}>Or with email</Text>
          <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              label="Sign in"
              variant="secondary"
              onPress={() => emailPassword.signIn(email, password)}
              loading={emailPassword.loading}
              disabled={!email || !password}
            />
            <Button
              label="Sign up"
              onPress={() => emailPassword.signUp(email, password)}
              loading={emailPassword.loading}
              disabled={!email || !password}
            />
          </View>
        </View>

        {error ? <Text style={[typography.bodySmall, { color: colors.danger }]}>{error.message}</Text> : null}
      </View>
    </ScreenContainer>
  );
}
