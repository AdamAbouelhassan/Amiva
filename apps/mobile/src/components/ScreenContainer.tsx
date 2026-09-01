import { PropsWithChildren } from 'react';
import { RefreshControl, ScrollView, View, ViewProps } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { useTabBarInset } from '../hooks/useTabBarInset';
import { spacing, useTheme } from '../theme';

interface ScreenContainerProps extends PropsWithChildren {
  scroll?: boolean;
  style?: ViewProps['style'];
  contentStyle?: ViewProps['style'];
  /** Inset the top edge for the status bar / notch. Needed for screens
   * with no native header — the 5 tab home screens (which render their
   * own title), SignIn, Onboarding. Screens that keep the native header
   * must leave this off, or they get a blank bar below the header. */
  safeAreaTop?: boolean;
  /** Wire `useRefresh()` here for pull-to-refresh on a `scroll` screen.
   * Screens with their own `FlatList` pass these to the list instead. */
  onRefresh?: () => void | Promise<unknown>;
  refreshing?: boolean;
}

/** The one place page background/padding is set — every screen renders
 * inside this instead of ad-hoc View/SafeAreaView combos. */
export function ScreenContainer({
  children,
  scroll = true,
  style,
  contentStyle,
  safeAreaTop = false,
  onRefresh,
  refreshing = false,
}: ScreenContainerProps) {
  const t = useTheme();
  const tabInset = useTabBarInset();
  const edges: Edge[] = safeAreaTop ? ['top', 'left', 'right'] : ['left', 'right'];

  const body = children;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.background }} edges={edges}>
      {scroll ? (
        <ScrollView
          style={[{ flex: 1 }, style]}
          contentContainerStyle={[
            { padding: spacing.screen, gap: spacing.lg },
            contentStyle,
            { paddingBottom: spacing.screen + tabInset },
          ]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={t.colors.accent}
                colors={[t.colors.accent]}
              />
            ) : undefined
          }
        >
          {body}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, style]}>{body}</View>
      )}
    </SafeAreaView>
  );
}
