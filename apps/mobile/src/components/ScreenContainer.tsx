import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

interface ScreenContainerProps extends PropsWithChildren {
  scroll?: boolean;
  style?: ViewProps['style'];
}

/** The one place page background/padding is set — every screen renders
 * inside this instead of ad-hoc View/SafeAreaView combos. */
export function ScreenContainer({ children, scroll = true, style }: ScreenContainerProps) {
  const Container = scroll ? ScrollView : View;
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Container style={[styles.content, style]} contentContainerStyle={scroll ? styles.scrollContent : undefined}>
        {children}
      </Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
});
