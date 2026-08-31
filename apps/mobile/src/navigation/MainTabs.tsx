import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AccountNavigator } from '../modules/account/AccountNavigator';
import { DiscoveryNavigator } from '../modules/discovery/DiscoveryNavigator';
import { LogbookNavigator } from '../modules/logbook/LogbookNavigator';
import { PlannerNavigator } from '../modules/planner/PlannerNavigator';
import { SocialNavigator } from '../modules/social/SocialNavigator';
import { NavIcon, NavIconName } from '../components/icons/NavIcon';
import { fonts, useTheme } from '../theme';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const t = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: t.colors.accent,
        tabBarInactiveTintColor: t.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: t.colors.surface,
          borderTopColor: t.colors.border,
        },
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
        tabBarIcon: ({ color, size }) => (
          <NavIcon name={route.name as NavIconName} color={color} size={size ?? 24} />
        ),
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
