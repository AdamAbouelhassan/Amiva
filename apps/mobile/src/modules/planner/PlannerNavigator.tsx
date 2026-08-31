import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PlannerStackParamList } from '../../navigation/types';
import { useStackScreenOptions } from '../../navigation/screenOptions';
import { AddPlacesToPlanScreen } from './screens/AddPlacesToPlanScreen';
import { CompletePlannedTripScreen } from './screens/CompletePlannedTripScreen';
import { CreatePlannedTripScreen } from './screens/CreatePlannedTripScreen';
import { EditPlannedTripScreen } from './screens/EditPlannedTripScreen';
import { PlannedTripDetailScreen } from './screens/PlannedTripDetailScreen';
import { PlannerOverviewScreen } from './screens/PlannerOverviewScreen';

const Stack = createNativeStackNavigator<PlannerStackParamList>();

export function PlannerNavigator() {
  return (
    <Stack.Navigator screenOptions={useStackScreenOptions()}>
      <Stack.Screen name="PlannerOverview" component={PlannerOverviewScreen} options={{ title: 'Planner' }} />
      <Stack.Screen name="PlannedTripDetail" component={PlannedTripDetailScreen} options={{ title: 'Planned trip' }} />
      <Stack.Screen name="AddPlacesToPlan" component={AddPlacesToPlanScreen} options={{ title: 'Add places' }} />
      <Stack.Screen
        name="EditPlannedTrip"
        component={EditPlannedTripScreen}
        options={{ title: 'Edit planned trip', presentation: 'modal' }}
      />
      <Stack.Screen
        name="CreatePlannedTrip"
        component={CreatePlannedTripScreen}
        options={{ title: 'New planned trip', presentation: 'modal' }}
      />
      <Stack.Screen
        name="CompletePlannedTrip"
        component={CompletePlannedTripScreen}
        options={{ title: 'Complete trip', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
