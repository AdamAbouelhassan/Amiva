import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { AuthBootstrap } from '../modules/account/components/AuthBootstrap';
import { OnboardingScreen } from '../modules/account/screens/OnboardingScreen';
import { SignInScreen } from '../modules/account/screens/SignInScreen';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { colors } from '../theme';
import { MainTabs } from './MainTabs';

function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

/** Gate: signed out -> SignInScreen; signed in but no Firestore profile
 * yet -> OnboardingScreen; otherwise -> the main tabbed app. */
function Gate() {
  const { firebaseUser, initializing, profile, isProfileLoading } = useCurrentUser();

  if (initializing) return <LoadingScreen />;
  if (!firebaseUser) return <SignInScreen />;
  if (isProfileLoading) return <LoadingScreen />;
  if (!profile) return <OnboardingScreen />;
  return <MainTabs />;
}

export function RootNavigator() {
  return (
    <NavigationContainer>
      <AuthBootstrap />
      <Gate />
    </NavigationContainer>
  );
}
