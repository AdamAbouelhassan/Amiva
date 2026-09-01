import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LogbookStackParamList } from '../../navigation/types';
import { useStackScreenOptions } from '../../navigation/screenOptions';
import { CityDetailScreen } from './screens/CityDetailScreen';
import { CountryDetailScreen } from './screens/CountryDetailScreen';
import { CreateExperienceScreen } from './screens/CreateExperienceScreen';
import { CreateTripScreen } from './screens/CreateTripScreen';
import { EditExperienceScreen } from './screens/EditExperienceScreen';
import { EditTripScreen } from './screens/EditTripScreen';
import { ExperienceDetailScreen } from './screens/ExperienceDetailScreen';
import { LogbookHomeScreen } from './screens/LogbookHomeScreen';
import { TripDetailScreen } from './screens/TripDetailScreen';

const Stack = createNativeStackNavigator<LogbookStackParamList>();

export function LogbookNavigator() {
  return (
    <Stack.Navigator screenOptions={useStackScreenOptions()}>
      <Stack.Screen name="LogbookHome" component={LogbookHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="TripDetail" component={TripDetailScreen} options={{ title: 'Trip' }} />
      <Stack.Screen
        name="EditTrip"
        component={EditTripScreen}
        options={{ title: 'Edit trip', presentation: 'modal' }}
      />
      <Stack.Screen name="CountryDetail" component={CountryDetailScreen} options={{ title: 'Country' }} />
      <Stack.Screen name="CityDetail" component={CityDetailScreen} options={{ title: 'City' }} />
      <Stack.Screen name="CreateTrip" component={CreateTripScreen} options={{ title: 'New trip', presentation: 'modal' }} />
      <Stack.Screen
        name="CreateExperience"
        component={CreateExperienceScreen}
        options={{ title: 'Log experience', presentation: 'modal' }}
      />
      <Stack.Screen name="ExperienceDetail" component={ExperienceDetailScreen} options={{ title: 'Experience' }} />
      <Stack.Screen
        name="EditExperience"
        component={EditExperienceScreen}
        options={{ title: 'Edit experience', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
