import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { AccountNavigator } from '../modules/account/AccountNavigator';
import { DiscoveryNavigator } from '../modules/discovery/DiscoveryNavigator';
import { LogbookNavigator } from '../modules/logbook/LogbookNavigator';
import { PlannerNavigator } from '../modules/planner/PlannerNavigator';
import { SocialNavigator } from '../modules/social/SocialNavigator';
import { colors } from '../theme';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, string> = {
  Discovery: '✦',
  Logbook: '📖',
  Planner: '🗺',
  Social: '👥',
  Account: '◐',
};

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>{TAB_ICONS[route.name as keyof MainTabParamList]}</Text>,
      })}
    >
      <Tab.Screen name="Discovery" component={DiscoveryNavigator} />
      <Tab.Screen name="Logbook" component={LogbookNavigator} />
      <Tab.Screen name="Planner" component={PlannerNavigator} />
      <Tab.Screen name="Social" component={SocialNavigator} />
      <Tab.Screen name="Account" component={AccountNavigator} />
    </Tab.Navigator>
  );
}
