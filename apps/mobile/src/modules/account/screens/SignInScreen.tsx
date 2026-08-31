import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '../../../components/Button';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TextField } from '../../../components/TextField';
import { BrandMark } from '../../../components/icons/BrandMark';
import { spacing, useTheme } from '../../../theme';
import { useEmailPasswordAuth } from '../hooks/useEmailPasswordAuth';
import { useFacebookSignIn } from '../hooks/useFacebookSignIn';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn';

export function SignInScreen() {
  const t = useTheme();
  const google = useGoogleSignIn();
  const facebook = useFacebookSignIn();
  const emailPassword = useEmailPasswordAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const error = google.error ?? facebook.error ?? emailPassword.error;

  return (
    <ScreenContainer safeAreaTop>
      <View style={{ alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl }}>
        <BrandMark size={72} />
        <Text style={t.type.displayLg}>Amiva</Text>
        <Text style={[t.type.body, { color: t.colors.textSecondary, textAlign: 'center' }]}>
          Log your travels, discover your style, find your people.
        </Text>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Button
          label="Continue with Google"
          onPress={google.signIn}
          loading={google.signingIn}
          disabled={!google.ready}
        />
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
      */}
      <View
        style={{ gap: spacing.sm, borderTopWidth: 1, borderTopColor: t.colors.border, paddingTop: spacing.lg }}
      >
        <Text style={t.type.subtitle}>Or with email</Text>
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button
              label="Sign in"
              variant="secondary"
              onPress={() => emailPassword.signIn(email, password)}
              loading={emailPassword.loading}
              disabled={!email || !password}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label="Sign up"
              onPress={() => emailPassword.signUp(email, password)}
              loading={emailPassword.loading}
              disabled={!email || !password}
            />
          </View>
        </View>
      </View>

      {error ? <Text style={[t.type.bodySmall, { color: t.colors.danger }]}>{error.message}</Text> : null}
    </ScreenContainer>
  );
}
