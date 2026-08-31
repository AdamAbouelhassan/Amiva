import { useRef, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { spacing, useTheme } from '../../../theme';
import { FriendsScreen } from './FriendsScreen';
import { RecommendationsScreen } from './RecommendationsScreen';
import { TrendingScreen } from './TrendingScreen';

type Tab = 'local' | 'trending' | 'friends';

interface DiscoveryScreenProps {
  navigation: { navigate: (screen: 'ExperienceDetail', params: { experienceId: string }) => void };
}

/** Discovery — three in-page tabs (brief). Local = Google-Places
 * recommendations near a location; Trending = most popular experiences
 * across Amiva; Friends = a chronological friend-activity feed.
 *
 * Each pane is mounted on first visit and then KEPT mounted (toggled via
 * `display`), so switching tabs — or leaving Discovery and coming back —
 * preserves each pane's data, scroll position, and filter state instead of
 * refetching every time. */
export function DiscoveryScreen({ navigation }: DiscoveryScreenProps) {
  const t = useTheme();
  const [tab, setTab] = useState<Tab>('local');
  const visited = useRef<Set<Tab>>(new Set(['local']));
  visited.current.add(tab);

  const pane = (key: Tab, node: React.ReactNode) =>
    visited.current.has(key) ? (
      <View key={key} style={{ flex: 1, display: tab === key ? 'flex' : 'none' }}>
        {node}
      </View>
    ) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.background }} edges={['left', 'right']}>
      <View style={{ paddingHorizontal: spacing.screen, paddingTop: spacing.sm, paddingBottom: spacing.xs }}>
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

      <View style={{ flex: 1 }}>
        {pane('local', <RecommendationsScreen />)}
        {pane('trending', <TrendingScreen navigation={navigation} />)}
        {pane('friends', <FriendsScreen navigation={navigation} />)}
      </View>
    </SafeAreaView>
  );
}
