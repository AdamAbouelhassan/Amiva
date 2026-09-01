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
        {/* Match % top-right, Save top-left, Log bottom-left, Share
            bottom-right — the body is just identity + title + place. */}
        <View>
          <AppImage
            uri={experience.photoUrls[0]}
            style={{ width: '100%', height: experience.photoUrls[0] ? 190 : 96 }}
          />

          {matchScore !== undefined ? (
            <View style={{ position: 'absolute', top: spacing.xs, right: spacing.xs }}>
              <MatchScoreBadge
                matchPercent={toMatchPercent(matchScore)}
                vectorA={profile?.travelStyle}
                vectorB={experience.categoryScores}
                detailTitle={ownerQuery.data?.name ?? 'This experience'}
              />
            </View>
          ) : null}

          {!isOwner ? (
            <>
              <View style={{ position: 'absolute', top: spacing.xs, left: spacing.xs }}>
                <IconButton
                  variant="overlay"
                  name={save.saved ? 'bookmark' : 'bookmark-outline'}
                  active={save.saved}
                  onPress={save.toggle}
                  accessibilityLabel={save.saved ? 'Saved' : 'Save'}
                />
              </View>
              <View style={{ position: 'absolute', bottom: spacing.xs, left: spacing.xs }}>
                <IconButton
                  variant="overlay"
                  name="add-circle-outline"
                  onPress={() => logNav.fromExperience(experience)}
                  loading={logNav.preparing}
                  accessibilityLabel="Log this in your logbook"
                />
              </View>
            </>
          ) : null}

          <View style={{ position: 'absolute', bottom: spacing.xs, right: spacing.xs }}>
            <IconButton
              variant="overlay"
              name="share-social-outline"
              onPress={() =>
                Share.share({ message: `${experience.title} — ${experience.city}, ${experience.country} on Amiva` })
              }
              accessibilityLabel="Share"
            />
          </View>
        </View>

        <View style={{ padding: spacing.md, gap: spacing.xxs }}>
          <ProfileIdentity
            name={`${ownerQuery.data?.name ?? '…'}${isFriend ? '  ·  Friend' : ''}`}
            username={ownerQuery.data?.username}
            photoUrl={ownerQuery.data?.profilePhotoUrl}
          />
          <Text style={[t.type.subtitle, { marginTop: spacing.xxs }]} numberOfLines={1}>
            {experience.title}
          </Text>
          <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]}>
            {experience.city}, {experience.country}
          </Text>
        </View>
      </Pressable>
    </Card>
  );
}
