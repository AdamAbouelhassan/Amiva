import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LogbookStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
import { CityDetailScreen } from './screens/CityDetailScreen';
import { CreateExperienceScreen } from './screens/CreateExperienceScreen';
import { CreateTripScreen } from './screens/CreateTripScreen';
import { ExperienceDetailScreen } from './screens/ExperienceDetailScreen';
import { LogbookHomeScreen } from './screens/LogbookHomeScreen';
import { TripDetailScreen } from './screens/TripDetailScreen';

const Stack = createNativeStackNavigator<LogbookStackParamList>();

export function LogbookNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.textPrimary }}>
      <Stack.Screen name="LogbookHome" component={LogbookHomeScreen} options={{ title: 'Logbook' }} />
      <Stack.Screen name="TripDetail" component={TripDetailScreen} options={{ title: 'Trip' }} />
      <Stack.Screen name="CityDetail" component={CityDetailScreen} options={{ title: 'City' }} />
      <Stack.Screen name="CreateTrip" component={CreateTripScreen} options={{ title: 'New trip', presentation: 'modal' }} />
      <Stack.Screen
        name="CreateExperience"
        component={CreateExperienceScreen}
        options={{ title: 'Log experience', presentation: 'modal' }}
      />
      <Stack.Screen name="ExperienceDetail" component={ExperienceDetailScreen} options={{ title: 'Experience' }} />
    </Stack.Navigator>
  );
}
