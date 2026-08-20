import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DiscoveryStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
// Reused from Logbook — one screen, shown identically whether reached from
// the feed or from a user's own Logbook (functional_specification.md §2.6:
// match % + radar chart wherever an experience is viewed).
import { ExperienceDetailScreen } from '../logbook/screens/ExperienceDetailScreen';
import { FeedScreen } from './screens/FeedScreen';
import { RecommendationsScreen } from './screens/RecommendationsScreen';
import { SearchScreen } from './screens/SearchScreen';
import { TrendingScreen } from './screens/TrendingScreen';

const Stack = createNativeStackNavigator<DiscoveryStackParamList>();

export function DiscoveryNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.textPrimary }}>
      <Stack.Screen name="Feed" component={FeedScreen} options={{ title: 'Discover' }} />
      <Stack.Screen name="ExperienceDetail" component={ExperienceDetailScreen} options={{ title: 'Experience' }} />
      <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Search' }} />
      <Stack.Screen name="Trending" component={TrendingScreen} options={{ title: 'Trending' }} />
      <Stack.Screen name="Recommendations" component={RecommendationsScreen} options={{ title: 'For you' }} />
    </Stack.Navigator>
  );
}
