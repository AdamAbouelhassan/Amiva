import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, ViewProps } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

interface ScreenContainerProps extends PropsWithChildren {
  scroll?: boolean;
  style?: ViewProps['style'];
  /** Inset the top edge for the status bar / notch. Only needed for
   * screens rendered outside a navigator header (SignIn, Onboarding) —
   * every screen inside a stack navigator already gets that inset from
   * the native header, and adding it here would leave a blank bar below
   * the header. */
  safeAreaTop?: boolean;
}

/** The one place page background/padding is set — every screen renders
 * inside this instead of ad-hoc View/SafeAreaView combos. */
export function ScreenContainer({ children, scroll = true, style, safeAreaTop = false }: ScreenContainerProps) {
  const Container = scroll ? ScrollView : View;
  const edges: Edge[] = safeAreaTop ? ['top', 'left', 'right'] : ['left', 'right'];
  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
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
