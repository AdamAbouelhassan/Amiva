/**
 * Friend discovery — functional_specification.md §6.3: contacts sync and
 * QR/shareable link, direct-add, no in-app people search.
 */
import { useState } from 'react';
import { Share, Text, View } from 'react-native';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { ProfileIdentity } from '../../../components/ProfileIdentity';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { Section } from '../../../components/Section';
import { TextField } from '../../../components/TextField';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { spacing, useTheme } from '../../../theme';
import { useContactsSync } from '../hooks/useContactsSync';
import { useAddFriend } from '../hooks/useFriends';

export function AddFriendScreen() {
  const t = useTheme();
  const { profile } = useCurrentUser();
  const [pastedLink, setPastedLink] = useState('');
  const addFriend = useAddFriend();
  const contactsSync = useContactsSync();

  const shareableLink = profile ? `amiva://addfriend/${profile.uid}` : '';

  async function shareLink() {
    if (!shareableLink) return;
    try {
      await Share.share({ message: `Add me on Amiva: ${shareableLink}` });
    } catch {
      /* dismissed */
    }
  }

  function extractUidFromLink(link: string): string | undefined {
    const match = link.trim().match(/addfriend\/([\w-]+)/);
    return match ? match[1] : link.trim() || undefined;
  }

  const addFriendStatus = addFriend.isError ? (
    <Text style={[t.type.bodySmall, { color: t.colors.danger }]}>
      Couldn’t add friend: {addFriend.error instanceof Error ? addFriend.error.message : String(addFriend.error)}
    </Text>
  ) : addFriend.isSuccess ? (
    <Text style={[t.type.bodySmall, { color: t.colors.success }]}>Friend added.</Text>
  ) : null;

  return (
    <ScreenContainer>
      <Text style={t.type.displayMd}>Add a friend</Text>

      <Section title="Your link" hint="Share this so someone can add you directly.">
        <Button label="Share my link" variant="secondary" disabled={!shareableLink} onPress={shareLink} />
      </Section>

      <Section title="Add via link">
        <TextField
          label="Paste a friend's link"
          value={pastedLink}
          onChangeText={setPastedLink}
          autoCapitalize="none"
        />
        <Button
          label="Add"
          disabled={!pastedLink.trim() || addFriend.isPending}
          loading={addFriend.isPending}
          onPress={() => {
            const friendId = extractUidFromLink(pastedLink);
            if (friendId) addFriend.mutate({ friendId, addedVia: 'qr_link' }, { onSuccess: () => setPastedLink('') });
          }}
        />
        {addFriendStatus}
      </Section>

      <Section title="Sync contacts">
        <Button
          label="Find friends from contacts"
          variant="secondary"
          loading={contactsSync.loading}
          onPress={contactsSync.sync}
        />
        {contactsSync.error && (
          <Text style={[t.type.bodySmall, { color: t.colors.danger }]}>{contactsSync.error.message}</Text>
        )}

        {contactsSync.matches.length > 0 && (
          <Card padded style={{ gap: spacing.xs }}>
            {contactsSync.matches.map((item) => (
              <View
                key={item.userId}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: spacing.sm,
                  paddingVertical: spacing.xxs,
                }}
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
            {addFriendStatus}
          </Card>
        )}
      </Section>
    </ScreenContainer>
  );
}
