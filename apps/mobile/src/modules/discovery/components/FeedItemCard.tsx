import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { toMatchPercent } from '@amiva/core';
import { MatchBadge } from '../../../components/MatchBadge';
import { ProfileIdentity } from '../../../components/ProfileIdentity';
import { orNull } from '../../../lib/queryHelpers';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useExperience } from '../../logbook/hooks/useExperiences';
import { SaveRepository } from '../../../repositories/saveRepository';
import { UserRepository } from '../../../repositories/userRepository';
import { colors, radius, spacing, typography } from '../../../theme';

interface FeedItemCardProps {
  experienceId: string;
  /** Omitted for Trending, which isn't relationship-based. */
  isFriend?: boolean;
  matchScore?: number;
  onPress: () => void;
}

/** Shared card for Feed/Trending — experienceId-driven rather than taking a
 * full experience object, since both server-side sources (getFeed,
 * getTrending) now return ranked ids, not full documents (see each hook's
 * header comment for why). A single-doc fetch per card is a Firestore
 * read the privacy rule can evaluate directly (unlike the collection query
 * that used to happen here), same pattern Trending's row already used. */
export function FeedItemCard({ experienceId, isFriend, matchScore, onPress }: FeedItemCardProps) {
  const { profile } = useCurrentUser();
  const queryClient = useQueryClient();
  const { data: experience } = useExperience(experienceId);

  const ownerQuery = useQuery({
    queryKey: ['users', experience?.ownerId],
    queryFn: () => UserRepository.getById(experience!.ownerId).then(orNull),
    enabled: !!experience,
  });

  const savedQuery = useQuery({
    queryKey: ['saves', profile?.uid, experienceId],
    queryFn: () => SaveRepository.isSaved(profile!.uid, experienceId),
    enabled: !!profile,
  });

  const toggleSave = useMutation({
    mutationFn: async () => {
      if (!profile) return;
      if (savedQuery.data) {
        await SaveRepository.unsave(profile.uid, experienceId);
      } else {
        await SaveRepository.save(profile.uid, experienceId);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saves', profile?.uid, experienceId] }),
  });

  if (!experience) return null;
  const isOwner = profile?.uid === experience.ownerId;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {experience.photoUrls[0] ? (
        <Image source={{ uri: experience.photoUrls[0] }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]} />
      )}
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <ProfileIdentity
            name={`${ownerQuery.data?.name ?? '…'}${isFriend ? ' · Friend' : ''}`}
            username={ownerQuery.data?.username}
            photoUrl={ownerQuery.data?.profilePhotoUrl}
          />
          {matchScore !== undefined && <MatchBadge matchPercent={toMatchPercent(matchScore)} />}
        </View>
        <Text style={typography.body} numberOfLines={1}>
          {experience.title}
        </Text>
        <Text style={typography.bodySmall}>
          {experience.city}, {experience.country}
        </Text>
        {!isOwner && (
          <Pressable hitSlop={8} onPress={() => toggleSave.mutate()} style={styles.saveRow}>
            <Text style={styles.saveLabel}>{savedQuery.data ? '✓ Saved' : '+ Save'}</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  photo: {
    width: '100%',
    height: 180,
  },
  photoPlaceholder: {
    backgroundColor: colors.surfaceAlt,
  },
  body: {
    padding: spacing.sm,
    gap: spacing.xxs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  saveRow: {
    alignSelf: 'flex-start',
    marginTop: spacing.xxs,
  },
  saveLabel: {
    ...typography.caption,
    color: colors.accent,
  },
});
