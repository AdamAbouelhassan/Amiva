import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PlannerStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
import { CreatePlannedTripScreen } from './screens/CreatePlannedTripScreen';
import { PlannedTripDetailScreen } from './screens/PlannedTripDetailScreen';
import { PlannerOverviewScreen } from './screens/PlannerOverviewScreen';

const Stack = createNativeStackNavigator<PlannerStackParamList>();

export function PlannerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.textPrimary }}>
      <Stack.Screen name="PlannerOverview" component={PlannerOverviewScreen} options={{ title: 'Planner' }} />
      <Stack.Screen name="PlannedTripDetail" component={PlannedTripDetailScreen} options={{ title: 'Planned trip' }} />
      <Stack.Screen
        name="CreatePlannedTrip"
        component={CreatePlannedTripScreen}
        options={{ title: 'New planned trip', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
