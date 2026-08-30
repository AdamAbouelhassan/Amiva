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
import { Share, Text, View } from 'react-native';
import { Button } from '../../../components/Button';
import { ProfileIdentity } from '../../../components/ProfileIdentity';
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

  async function shareLink() {
    if (!shareableLink) return;
    // Opens the OS share sheet with the message prefilled — pick
    // Messages to text it to someone. `Share` degrades gracefully if a
    // target app is missing (unlike an `sms:` deep link).
    try {
      await Share.share({ message: `Add me on Amiva: ${shareableLink}` });
    } catch {
      // user dismissed the sheet, or no share targets — nothing to do
    }
  }

  function extractUidFromLink(link: string): string | undefined {
    const match = link.trim().match(/addfriend\/([\w-]+)/);
    return match ? match[1] : link.trim() || undefined;
  }

  // The add is a fire-and-forget callable with no screen of its own to
  // land on — without this the user gets zero signal whether it worked.
  const addFriendStatus = addFriend.isError ? (
    <Text style={{ color: colors.danger }}>
      Couldn’t add friend: {addFriend.error instanceof Error ? addFriend.error.message : String(addFriend.error)}
    </Text>
  ) : addFriend.isSuccess ? (
    <Text style={{ color: colors.success }}>Friend added.</Text>
  ) : null;

  return (
    <ScreenContainer>
      <Text style={typography.displayMd}>Add a friend</Text>

      <View style={{ gap: spacing.xs }}>
        <Text style={typography.subtitle}>Your link</Text>
        <Button label="Share" variant="secondary" disabled={!shareableLink} onPress={shareLink} />
      </View>

      <View style={{ gap: spacing.xs }}>
        <Text style={typography.subtitle}>Add via link</Text>
        <TextField label="Paste a friend's link" value={pastedLink} onChangeText={setPastedLink} autoCapitalize="none" />
        <Button
          label="Add"
          disabled={!pastedLink.trim() || addFriend.isPending}
          loading={addFriend.isPending}
          onPress={() => {
            const friendId = extractUidFromLink(pastedLink);
            if (friendId) {
              addFriend.mutate({ friendId, addedVia: 'qr_link' }, { onSuccess: () => setPastedLink('') });
            }
          }}
        />
        {addFriendStatus}
      </View>

      <View style={{ gap: spacing.xs }}>
        <Text style={typography.subtitle}>Sync contacts</Text>
        <Button label="Find friends from contacts" variant="secondary" loading={contactsSync.loading} onPress={contactsSync.sync} />
        {contactsSync.error && <Text style={{ color: colors.danger }}>{contactsSync.error.message}</Text>}

        {/* Plain map, not a FlatList: the match set is a small bounded
            list and this screen already scrolls inside ScreenContainer —
            a nested VirtualizedList of the same orientation breaks
            windowing and warns. */}
        {contactsSync.matches.map((item) => (
          <View
            key={item.userId}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs }}
          >
            <ProfileIdentity name={item.name} username={item.username} photoUrl={item.profilePhotoUrl} />
            <Button
              label="Add"
              disabled={addFriend.isPending}
              loading={addFriend.isPending && addFriend.variables?.friendId === item.userId}
              onPress={() => addFriend.mutate({ friendId: item.userId, addedVia: 'contacts_sync' })}
            />
          </View>
        ))}
        {contactsSync.matches.length > 0 ? addFriendStatus : null}
      </View>
    </ScreenContainer>
  );
}
