import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, Text } from 'react-native';
import { DiscoveryStackParamList } from '../../navigation/types';
import { useStackScreenOptions } from '../../navigation/screenOptions';
import { useTheme } from '../../theme';
// Reused from Logbook — shown identically wherever it's reached
// (functional_specification.md §2.6).
import { CreateExperienceScreen } from '../logbook/screens/CreateExperienceScreen';
import { EditExperienceScreen } from '../logbook/screens/EditExperienceScreen';
import { ExperienceDetailScreen } from '../logbook/screens/ExperienceDetailScreen';
import { DiscoveryScreen } from './screens/DiscoveryScreen';
import { SavedScreen } from './screens/SavedScreen';

const Stack = createNativeStackNavigator<DiscoveryStackParamList>();

export function DiscoveryNavigator() {
  const t = useTheme();
  return (
    <Stack.Navigator screenOptions={useStackScreenOptions()}>
      {/* Local / Trending / Friends are in-page tabs on DiscoveryScreen,
          not routes. */}
      <Stack.Screen
        name="DiscoverHome"
        component={DiscoveryScreen}
        options={({ navigation }) => ({
          title: 'Discover',
          headerRight: () => (
            <Pressable onPress={() => navigation.navigate('Saved')} accessibilityRole="button" hitSlop={8}>
              <Text style={[t.type.subtitle, { color: t.colors.accent }]}>Saved</Text>
            </Pressable>
          ),
        })}
      />
      <Stack.Screen name="Saved" component={SavedScreen} options={{ title: 'Saved' }} />
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
    </Stack.Navigator>
  );
}
