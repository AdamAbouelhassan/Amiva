import { useDeferredValue, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { TabPanes } from '../../../components/TabPanes';
import { spacing, useTheme } from '../../../theme';
import { FriendsScreen } from './FriendsScreen';
import { RecommendationsScreen } from './RecommendationsScreen';
import { TrendingScreen } from './TrendingScreen';

type Tab = 'local' | 'trending' | 'friends';

interface DiscoveryScreenProps {
  navigation: {
    navigate: (screen: 'ExperienceDetail' | 'Saved', params?: { experienceId: string }) => void;
  };
}

/** Discovery — three in-page tabs (brief). Local = Google-Places
 * recommendations; Trending = most popular experiences; Friends = a
 * chronological friend-activity feed. Panes are kept mounted (via
 * `TabPanes`) so scroll position / filters / data survive tab switches;
 * switching cross-dissolves. */
export function DiscoveryScreen({ navigation }: DiscoveryScreenProps) {
  const t = useTheme();
  const [tab, setTab] = useState<Tab>('local');
  // The segmented control follows `tab` immediately (the pill springs on
  // tap); the heavier pane swap runs off the deferred value so it never
  // blocks the tap. Panes are memoised so a tab change doesn't re-render
  // the other two.
  const deferredTab = useDeferredValue(tab);
  const panes = useMemo(
    () => [
      { key: 'local', node: <RecommendationsScreen /> },
      { key: 'trending', node: <TrendingScreen navigation={navigation} /> },
      { key: 'friends', node: <FriendsScreen navigation={navigation} /> },
    ],
    [navigation],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.background }} edges={['top', 'left', 'right']}>
      <View style={{ paddingHorizontal: spacing.screen, paddingTop: spacing.sm, paddingBottom: spacing.xs, gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={t.type.displayMd}>Discover</Text>
          <Pressable onPress={() => navigation.navigate('Saved')} hitSlop={8} accessibilityRole="button">
            <Text style={[t.type.subtitle, { color: t.colors.accent }]}>Liked</Text>
          </Pressable>
        </View>
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: 'local', label: 'Local' },
            { value: 'trending', label: 'Trending' },
            { value: 'friends', label: 'Friends' },
          ]}
        />
      </View>

      <TabPanes activeKey={deferredTab} panes={panes} />
    </SafeAreaView>
  );
}
