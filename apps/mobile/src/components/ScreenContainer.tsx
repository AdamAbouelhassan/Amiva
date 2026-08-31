import { PropsWithChildren } from 'react';
import { ScrollView, View, ViewProps } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { spacing, useTheme } from '../theme';

interface ScreenContainerProps extends PropsWithChildren {
  scroll?: boolean;
  style?: ViewProps['style'];
  contentStyle?: ViewProps['style'];
  /** Inset the top edge for the status bar / notch. Only needed for
   * screens rendered outside a navigator header (SignIn, Onboarding) —
   * every screen inside a stack navigator already gets that inset from
   * the native header, and adding it here would leave a blank bar below
   * the header. */
  safeAreaTop?: boolean;
}

/** The one place page background/padding is set — every screen renders
 * inside this instead of ad-hoc View/SafeAreaView combos. */
export function ScreenContainer({
  children,
  scroll = true,
  style,
  contentStyle,
  safeAreaTop = false,
}: ScreenContainerProps) {
  const t = useTheme();
  const Container = scroll ? ScrollView : View;
  const edges: Edge[] = safeAreaTop ? ['top', 'left', 'right'] : ['left', 'right'];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.background }} edges={edges}>
      <Container
        style={[{ flex: 1 }, style]}
        contentContainerStyle={
          scroll ? [{ padding: spacing.screen, gap: spacing.lg }, contentStyle] : undefined
        }
        keyboardShouldPersistTaps={scroll ? 'handled' : undefined}
      >
        {children}
      </Container>
    </SafeAreaView>
  );
}
