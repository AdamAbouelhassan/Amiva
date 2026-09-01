import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SocialStackParamList } from '../../navigation/types';
import { useStackScreenOptions } from '../../navigation/screenOptions';
import { CreateExperienceScreen } from '../logbook/screens/CreateExperienceScreen';
import { ExperienceDetailScreen } from '../logbook/screens/ExperienceDetailScreen';
import { AddFriendScreen } from './screens/AddFriendScreen';
import { FriendDetailScreen } from './screens/FriendDetailScreen';
import { FriendsListScreen } from './screens/FriendsListScreen';
import { GroupTripDetailScreen } from './screens/GroupTripDetailScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';

const Stack = createNativeStackNavigator<SocialStackParamList>();

export function SocialNavigator() {
  return (
    <Stack.Navigator screenOptions={useStackScreenOptions()}>
      <Stack.Screen name="FriendsList" component={FriendsListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="FriendDetail" component={FriendDetailScreen} options={{ title: 'Compatibility' }} />
      <Stack.Screen name="AddFriend" component={AddFriendScreen} options={{ title: 'Add friend', presentation: 'modal' }} />
      <Stack.Screen name="GroupTripDetail" component={GroupTripDetailScreen} options={{ title: 'Group trip' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="ExperienceDetail" component={ExperienceDetailScreen} options={{ title: 'Experience' }} />
      <Stack.Screen
        name="CreateExperience"
        component={CreateExperienceScreen}
        options={{ title: 'Log experience', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
