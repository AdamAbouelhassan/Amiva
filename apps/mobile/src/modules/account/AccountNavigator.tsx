import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AccountStackParamList } from '../../navigation/types';
import { useStackScreenOptions } from '../../navigation/screenOptions';
import { EditTravelStyleScreen } from './screens/EditTravelStyleScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SettingsScreen } from './screens/SettingsScreen';

const Stack = createNativeStackNavigator<AccountStackParamList>();

export function AccountNavigator() {
  return (
    <Stack.Navigator screenOptions={useStackScreenOptions()}>
      {/* No native header — the screen renders its own title + "Settings" action. */}
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="EditTravelStyle" component={EditTravelStyleScreen} options={{ title: 'Edit travel style' }} />
    </Stack.Navigator>
  );
}
