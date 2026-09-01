import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AccountNavigator } from '../modules/account/AccountNavigator';
import { DiscoveryNavigator } from '../modules/discovery/DiscoveryNavigator';
import { LogbookNavigator } from '../modules/logbook/LogbookNavigator';
import { PlannerNavigator } from '../modules/planner/PlannerNavigator';
import { SocialNavigator } from '../modules/social/SocialNavigator';
import { FocusFade } from '../components/FocusFade';
import { GlassTabBar } from './GlassTabBar';
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
  return (
    <Tab.Navigator
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Discovery" component={DiscoveryTab} />
      <Tab.Screen name="Logbook" component={LogbookTab} />
      <Tab.Screen name="Planner" component={PlannerTab} />
      <Tab.Screen name="Social" component={SocialTab} />
      <Tab.Screen name="Account" component={AccountTab} />
    </Tab.Navigator>
  );
}
