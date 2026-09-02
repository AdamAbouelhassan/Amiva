import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DiscoveryStackParamList } from '../../navigation/types';
import { useStackScreenOptions } from '../../navigation/screenOptions';
// Reused from Logbook — shown identically wherever it's reached
// (functional_specification.md §2.6).
import { CreateExperienceScreen } from '../logbook/screens/CreateExperienceScreen';
import { EditExperienceScreen } from '../logbook/screens/EditExperienceScreen';
import { ExperienceDetailScreen } from '../logbook/screens/ExperienceDetailScreen';
import { MatchDetailScreen } from '../social/screens/MatchDetailScreen';
import { DiscoveryScreen } from './screens/DiscoveryScreen';
import { SavedScreen } from './screens/SavedScreen';

const Stack = createNativeStackNavigator<DiscoveryStackParamList>();

export function DiscoveryNavigator() {
  return (
    <Stack.Navigator screenOptions={useStackScreenOptions()}>
      {/* Local / Trending / Friends are in-page tabs on DiscoveryScreen,
          not routes. The "Liked" action lives in the screen body. */}
      <Stack.Screen name="DiscoverHome" component={DiscoveryScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Saved" component={SavedScreen} options={{ title: 'Liked' }} />
      <Stack.Screen name="ExperienceDetail" component={ExperienceDetailScreen} options={{ title: 'Experience' }} />
      <Stack.Screen
        name="EditExperience"
        component={EditExperienceScreen}
        options={{ title: 'Edit experience', presentation: 'modal' }}
      />
      <Stack.Screen
        name="CreateExperience"
        component={CreateExperienceScreen}
        options={{ title: 'Log experience', presentation: 'modal' }}
      />
      <Stack.Screen
        name="MatchDetail"
        component={MatchDetailScreen}
        options={{ title: 'Compatibility', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
