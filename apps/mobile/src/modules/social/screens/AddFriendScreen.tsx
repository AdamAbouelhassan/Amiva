/**
 * Friend discovery — functional_specification.md §6.3: contacts sync and
 * QR/shareable link, direct-add, no in-app people search.
 *
 * Simplification: renders the shareable link as selectable text rather
 * than an actual scannable QR image (no QR-rendering library in
 * technical_specification.md §1's stack) — same underlying deep link
 * (`amiva://addfriend/{uid}`), just without the camera-scan UX. A real QR
 * code image and camera scanner (expo-camera) are a follow-up, not faked
 * here.
 */
import { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { Button } from '../../../components/Button';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TextField } from '../../../components/TextField';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { colors, spacing, typography } from '../../../theme';
import { useContactsSync } from '../hooks/useContactsSync';
import { useAddFriend } from '../hooks/useFriends';

export function AddFriendScreen() {
  const { profile } = useCurrentUser();
  const [pastedLink, setPastedLink] = useState('');
  const addFriend = useAddFriend();
  const contactsSync = useContactsSync();

  const shareableLink = profile ? `amiva://addfriend/${profile.uid}` : '';

  function extractUidFromLink(link: string): string | undefined {
    const match = link.trim().match(/addfriend\/([\w-]+)/);
    return match ? match[1] : link.trim() || undefined;
  }

  return (
    <ScreenContainer>
      <Text style={typography.displayMd}>Add a friend</Text>

      <View style={{ gap: spacing.xs }}>
        <Text style={typography.subtitle}>Your link</Text>
        <Text selectable style={[typography.body, { color: colors.accent }]}>
          {shareableLink}
        </Text>
      </View>

      <View style={{ gap: spacing.xs }}>
        <Text style={typography.subtitle}>Add via link</Text>
        <TextField label="Paste a friend's link" value={pastedLink} onChangeText={setPastedLink} autoCapitalize="none" />
        <Button
          label="Add"
          disabled={!pastedLink.trim()}
          loading={addFriend.isPending}
          onPress={() => {
            const friendId = extractUidFromLink(pastedLink);
            if (friendId) addFriend.mutate({ friendId, addedVia: 'qr_link' });
          }}
        />
      </View>

      <View style={{ gap: spacing.xs }}>
        <Text style={typography.subtitle}>Or sync contacts</Text>
        <Button label="Find friends from contacts" variant="secondary" loading={contactsSync.loading} onPress={contactsSync.sync} />
        {contactsSync.error && <Text style={{ color: colors.danger }}>{contactsSync.error.message}</Text>}

        <FlatList
          data={contactsSync.matches}
          keyExtractor={(item) => item.userId}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs }}>
              <Text style={typography.body}>{item.name}</Text>
              <Button
                label="Add"
                onPress={() => addFriend.mutate({ friendId: item.userId, addedVia: 'contacts_sync' })}
              />
            </View>
          )}
        />
      </View>
    </ScreenContainer>
  );
}
