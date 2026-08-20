import { useQuery } from '@tanstack/react-query';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MatchBadge } from '../../../components/MatchBadge';
import { UserRepository } from '../../../repositories/userRepository';
import { colors, radius, spacing, typography } from '../../../theme';
import { toMatchPercent } from '@amiva/core';
import { FeedItem } from '../hooks/useFeed';

interface FeedItemCardProps {
  item: FeedItem;
  onPress: () => void;
}

export function FeedItemCard({ item, onPress }: FeedItemCardProps) {
  const { experience, isFriend, matchScore } = item;
  const ownerQuery = useQuery({
    queryKey: ['users', experience.ownerId],
    queryFn: () => UserRepository.getById(experience.ownerId),
  });

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {experience.photoUrls[0] ? (
        <Image source={{ uri: experience.photoUrls[0] }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]} />
      )}
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={typography.subtitle} numberOfLines={1}>
            {ownerQuery.data?.name ?? '…'}
            {isFriend ? ' · Friend' : ''}
          </Text>
          <MatchBadge matchPercent={toMatchPercent(matchScore)} />
        </View>
        <Text style={typography.body} numberOfLines={1}>
          {experience.title}
        </Text>
        <Text style={typography.bodySmall}>
          {experience.city}, {experience.country}
        </Text>
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
  },
});
