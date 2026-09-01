import { useQuery } from '@tanstack/react-query';
import { Pressable, Share, Text, View } from 'react-native';
import { toMatchPercent } from '@amiva/core';
import { AppImage } from '../../../components/AppImage';
import { Card } from '../../../components/Card';
import { IconButton } from '../../../components/IconButton';
import { MatchScoreBadge } from '../../../components/MatchScoreBadge';
import { ProfileIdentity } from '../../../components/ProfileIdentity';
import { orNull } from '../../../lib/queryHelpers';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useLogExperienceNav } from '../../../hooks/useLogExperienceNav';
import { useSaveToggle } from '../../../hooks/useSaves';
import { useExperience } from '../../logbook/hooks/useExperiences';
import { UserRepository } from '../../../repositories/userRepository';
import { spacing, useTheme } from '../../../theme';

interface FeedItemCardProps {
  experienceId: string;
  isFriend?: boolean;
  matchScore?: number;
  onPress: () => void;
}

export function FeedItemCard({ experienceId, isFriend, matchScore, onPress }: FeedItemCardProps) {
  const t = useTheme();
  const { profile } = useCurrentUser();
  const logNav = useLogExperienceNav();
  const { data: experience } = useExperience(experienceId);
  const save = useSaveToggle(experienceId);

  const ownerQuery = useQuery({
    queryKey: ['users', experience?.ownerId],
    queryFn: () => UserRepository.getById(experience!.ownerId).then(orNull),
    enabled: !!experience,
  });

  if (!experience) return null;
  const isOwner = profile?.uid === experience.ownerId;

  return (
    <Card padded={false} elevation="raised" style={{ overflow: 'hidden' }}>
      <Pressable onPress={onPress}>
        <AppImage uri={experience.photoUrls[0]} style={{ width: '100%', height: experience.photoUrls[0] ? 190 : 96 }} />
        <View style={{ padding: spacing.md, gap: spacing.xs }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm }}>
            <ProfileIdentity
              name={`${ownerQuery.data?.name ?? '…'}${isFriend ? '  ·  Friend' : ''}`}
              username={ownerQuery.data?.username}
              photoUrl={ownerQuery.data?.profilePhotoUrl}
            />
            {matchScore !== undefined && (
              <MatchScoreBadge
                matchPercent={toMatchPercent(matchScore)}
                vectorA={profile?.travelStyle}
                vectorB={experience.categoryScores}
                detailTitle={ownerQuery.data?.name ?? 'This experience'}
              />
            )}
          </View>

          <Text style={t.type.subtitle} numberOfLines={1}>
            {experience.title}
          </Text>
          <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]}>
            {experience.city}, {experience.country}
          </Text>

          {/* Save is the only engagement action (spec §5.1 — no likes/comments). */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xxs }}>
            {!isOwner && (
              <IconButton
                name={save.saved ? 'bookmark' : 'bookmark-outline'}
                active={save.saved}
                onPress={save.toggle}
                accessibilityLabel={save.saved ? 'Saved' : 'Save'}
              />
            )}
            {!isOwner && (
              <IconButton
                name="add-circle-outline"
                onPress={() => logNav.fromExperience(experience)}
                loading={logNav.preparing}
                accessibilityLabel="Log this in your logbook"
              />
            )}
            <IconButton
              name="share-social-outline"
              onPress={() =>
                Share.share({ message: `${experience.title} — ${experience.city}, ${experience.country} on Amiva` })
              }
              accessibilityLabel="Share"
            />
          </View>
        </View>
      </Pressable>
    </Card>
  );
}
