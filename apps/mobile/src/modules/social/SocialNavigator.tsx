import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SocialStackParamList } from '../../navigation/types';
import { useStackScreenOptions } from '../../navigation/screenOptions';
import { CreateExperienceScreen } from '../logbook/screens/CreateExperienceScreen';
import { ExperienceDetailScreen } from '../logbook/screens/ExperienceDetailScreen';
import { AddFriendScreen } from './screens/AddFriendScreen';
import { FriendDetailScreen } from './screens/FriendDetailScreen';
import { FriendTripDetailScreen } from './screens/FriendTripDetailScreen';
import { FriendsListScreen } from './screens/FriendsListScreen';
import { MatchDetailScreen } from './screens/MatchDetailScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';

const Stack = createNativeStackNavigator<SocialStackParamList>();

export function SocialNavigator() {
  return (
    <Stack.Navigator screenOptions={useStackScreenOptions()}>
      <Stack.Screen name="FriendsList" component={FriendsListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="FriendDetail" component={FriendDetailScreen} options={{ title: 'Compatibility' }} />
      <Stack.Screen name="FriendTripDetail" component={FriendTripDetailScreen} options={{ title: 'Trip' }} />
      <Stack.Screen name="AddFriend" component={AddFriendScreen} options={{ title: 'Add friend', presentation: 'modal' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="ExperienceDetail" component={ExperienceDetailScreen} options={{ title: 'Experience' }} />
      <Stack.Screen
        name="CreateExperience"
        component={CreateExperienceScreen}
        options={{ title: 'Log experience', presentation: 'modal' }}
      />
      <Stack.Screen
        name="MatchDetail"
        component={MatchDetailScreen}
        options={{ title: 'Compatibility', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
