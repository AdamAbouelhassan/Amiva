import { Text, View } from 'react-native';
import { Button } from '../../../components/Button';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { colors, spacing, typography } from '../../../theme';
import { useFacebookSignIn } from '../hooks/useFacebookSignIn';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn';

export function SignInScreen() {
  const google = useGoogleSignIn();
  const facebook = useFacebookSignIn();
  const error = google.error ?? facebook.error;

  return (
    <ScreenContainer scroll={false}>
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing.lg }}>
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

        {error ? <Text style={[typography.bodySmall, { color: colors.danger }]}>{error.message}</Text> : null}
      </View>
    </ScreenContainer>
  );
}
