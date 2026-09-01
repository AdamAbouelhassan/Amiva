import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import { AccountNavigator } from '../modules/account/AccountNavigator';
import { DiscoveryNavigator } from '../modules/discovery/DiscoveryNavigator';
import { LogbookNavigator } from '../modules/logbook/LogbookNavigator';
import { PlannerNavigator } from '../modules/planner/PlannerNavigator';
import { SocialNavigator } from '../modules/social/SocialNavigator';
import { FocusFade } from '../components/FocusFade';
import { NavIcon, NavIconName } from '../components/icons/NavIcon';
import { useTheme } from '../theme';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Module-level so identity is stable — an inline `{() => …}` render prop
// would remount the whole navigator on every MainTabs re-render (e.g. a
// theme toggle), dropping navigation state.
const DiscoveryTab = () => (
  <FocusFade>
    <DiscoveryNavigator />
  </FocusFade>
);
const LogbookTab = () => (
  <FocusFade>
    <LogbookNavigator />
  </FocusFade>
);
const PlannerTab = () => (
  <FocusFade>
    <PlannerNavigator />
  </FocusFade>
);
const SocialTab = () => (
  <FocusFade>
    <SocialNavigator />
  </FocusFade>
);
const AccountTab = () => (
  <FocusFade>
    <AccountNavigator />
  </FocusFade>
);

export function MainTabs() {
  const t = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: t.colors.accent,
        tabBarInactiveTintColor: t.colors.textSecondary,
        // Floats over content; scroll lists clear it via `useTabBarInset()`.
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: t.colors.surface,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: t.colors.border,
          elevation: 0,
        },
        tabBarIcon: ({ color, size, focused }) => (
          <NavIcon name={route.name as NavIconName} color={color} size={size ?? 24} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Discovery" component={DiscoveryTab} />
      <Tab.Screen name="Logbook" component={LogbookTab} />
      <Tab.Screen name="Planner" component={PlannerTab} />
      <Tab.Screen name="Social" component={SocialTab} />
      <Tab.Screen name="Account" component={AccountTab} />
    </Tab.Navigator>
  );
}
