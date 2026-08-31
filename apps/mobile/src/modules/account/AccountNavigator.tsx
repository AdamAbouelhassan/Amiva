import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, Text } from 'react-native';
import { AccountStackParamList } from '../../navigation/types';
import { useStackScreenOptions } from '../../navigation/screenOptions';
import { useTheme } from '../../theme';
import { EditTravelStyleScreen } from './screens/EditTravelStyleScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SettingsScreen } from './screens/SettingsScreen';

const Stack = createNativeStackNavigator<AccountStackParamList>();

export function AccountNavigator() {
  const t = useTheme();
  return (
    <Stack.Navigator screenOptions={useStackScreenOptions()}>
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={({ navigation }) => ({
          title: 'Profile',
          headerRight: () => (
            <Pressable onPress={() => navigation.navigate('Settings')} accessibilityRole="button" hitSlop={8}>
              <Text style={[t.type.subtitle, { color: t.colors.accent }]}>Settings</Text>
            </Pressable>
          ),
        })}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="EditTravelStyle" component={EditTravelStyleScreen} options={{ title: 'Edit travel style' }} />
    </Stack.Navigator>
  );
}
