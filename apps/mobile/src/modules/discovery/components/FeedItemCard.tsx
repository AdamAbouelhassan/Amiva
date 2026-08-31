import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image, Pressable, Share, Text, View } from 'react-native';
import { toMatchPercent } from '@amiva/core';
import { Card } from '../../../components/Card';
import { MatchScoreBadge } from '../../../components/MatchScoreBadge';
import { ProfileIdentity } from '../../../components/ProfileIdentity';
import { orNull } from '../../../lib/queryHelpers';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useExperience } from '../../logbook/hooks/useExperiences';
import { SaveRepository } from '../../../repositories/saveRepository';
import { UserRepository } from '../../../repositories/userRepository';
import { radius, spacing, useTheme } from '../../../theme';

interface FeedItemCardProps {
  experienceId: string;
  isFriend?: boolean;
  matchScore?: number;
  onPress: () => void;
}

export function FeedItemCard({ experienceId, isFriend, matchScore, onPress }: FeedItemCardProps) {
  const t = useTheme();
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
      if (savedQuery.data) await SaveRepository.unsave(profile.uid, experienceId);
      else await SaveRepository.save(profile.uid, experienceId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saves', profile?.uid, experienceId] }),
  });

  if (!experience) return null;
  const isOwner = profile?.uid === experience.ownerId;

  return (
    <Card padded={false} elevation="raised" style={{ overflow: 'hidden' }}>
      <Pressable onPress={onPress}>
        {experience.photoUrls[0] ? (
          <Image source={{ uri: experience.photoUrls[0] }} style={{ width: '100%', height: 190 }} />
        ) : (
          <View style={{ width: '100%', height: 96, backgroundColor: t.colors.surfaceAlt }} />
        )}
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
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xxs }}>
            {!isOwner && (
              <Pressable
                onPress={() => toggleSave.mutate()}
                hitSlop={8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xxs,
                  paddingVertical: spacing.xxs,
                  paddingHorizontal: spacing.sm,
                  borderRadius: radius.pill,
                  backgroundColor: savedQuery.data ? t.colors.accent : t.colors.accentMuted,
                }}
              >
                <Text
                  style={[
                    t.type.label,
                    { color: savedQuery.data ? t.colors.textOnAccent : t.colors.accent },
                  ]}
                >
                  {savedQuery.data ? 'Saved' : 'Save'}
                </Text>
              </Pressable>
            )}
            <Pressable
              hitSlop={8}
              onPress={() =>
                Share.share({ message: `${experience.title} — ${experience.city}, ${experience.country} on Amiva` })
              }
              style={{ paddingVertical: spacing.xxs, paddingHorizontal: spacing.sm }}
            >
              <Text style={[t.type.label, { color: t.colors.textSecondary }]}>Share</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Card>
  );
}
