import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SocialStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
import { AddFriendScreen } from './screens/AddFriendScreen';
import { FriendDetailScreen } from './screens/FriendDetailScreen';
import { FriendsListScreen } from './screens/FriendsListScreen';
import { GroupTripDetailScreen } from './screens/GroupTripDetailScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';

const Stack = createNativeStackNavigator<SocialStackParamList>();

export function SocialNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.textPrimary }}>
      <Stack.Screen name="FriendsList" component={FriendsListScreen} options={{ title: 'Friends' }} />
      <Stack.Screen name="FriendDetail" component={FriendDetailScreen} options={{ title: 'Compatibility' }} />
      <Stack.Screen name="AddFriend" component={AddFriendScreen} options={{ title: 'Add friend', presentation: 'modal' }} />
      <Stack.Screen name="GroupTripDetail" component={GroupTripDetailScreen} options={{ title: 'Group trip' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    </Stack.Navigator>
  );
}
