import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavDefaultTheme,
  NavigationContainer,
  Theme as NavTheme,
} from '@react-navigation/native';
import { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthBootstrap } from '../modules/account/components/AuthBootstrap';
import { OnboardingScreen } from '../modules/account/screens/OnboardingScreen';
import { SignInScreen } from '../modules/account/screens/SignInScreen';
import { BrandMark } from '../components/icons/BrandMark';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { spacing, useTheme } from '../theme';
import { MainTabs } from './MainTabs';

function LoadingScreen() {
  const t = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.lg,
        backgroundColor: t.colors.background,
      }}
    >
      <BrandMark size={72} />
      <ActivityIndicator color={t.colors.accent} />
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
  const t = useTheme();

  const navTheme = useMemo<NavTheme>(() => {
    const base = t.isDark ? NavDarkTheme : NavDefaultTheme;
    return {
      ...base,
      dark: t.isDark,
      colors: {
        ...base.colors,
        primary: t.colors.accent,
        background: t.colors.background,
        card: t.colors.surface,
        text: t.colors.textPrimary,
        border: t.colors.border,
        notification: t.colors.accentWarm,
      },
    };
  }, [t]);

  return (
    <NavigationContainer theme={navTheme}>
      <AuthBootstrap />
      <Gate />
    </NavigationContainer>
  );
}
