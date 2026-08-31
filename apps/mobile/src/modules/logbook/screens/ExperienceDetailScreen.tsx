import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Card } from '../../../components/Card';
import { MatchScoreBadge } from '../../../components/MatchScoreBadge';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TravelStyleRadar } from '../../../components/TravelStyleRadar';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useMatchScore } from '../../../hooks/useMatchScore';
import { SaveRepository } from '../../../repositories/saveRepository';
import { radius, spacing, useTheme } from '../../../theme';
import { useExperience } from '../hooks/useExperiences';

interface ExperienceDetailScreenProps {
  route: { params: { experienceId: string } };
}

export function ExperienceDetailScreen({ route }: ExperienceDetailScreenProps) {
  const t = useTheme();
  const { experienceId } = route.params;
  const { profile } = useCurrentUser();
  const { data: experience } = useExperience(experienceId);
  const [saved, setSaved] = useState(false);

  const matchScore = useMatchScore(
    profile ? { type: 'user', userId: profile.uid } : undefined,
    { type: 'experience', experienceId },
  );

  useEffect(() => {
    if (profile) SaveRepository.isSaved(profile.uid, experienceId).then(setSaved);
  }, [profile, experienceId]);

  if (!experience) return null;
  const isOwner = profile?.uid === experience.ownerId;

  async function toggleSave() {
    if (!profile) return;
    if (saved) await SaveRepository.unsave(profile.uid, experienceId);
    else await SaveRepository.save(profile.uid, experienceId);
    setSaved(!saved);
  }

  return (
    <ScreenContainer>
      {experience.photoUrls.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {experience.photoUrls.map((url) => (
            <Image
              key={url}
              source={{ uri: url }}
              style={{ width: 280, height: 200, borderRadius: radius.card, marginRight: spacing.sm }}
            />
          ))}
        </ScrollView>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Text style={t.type.displayMd}>{experience.title}</Text>
          <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]}>
            {experience.city}, {experience.country} · {experience.date.toDateString()}
          </Text>
          <Text style={{ color: t.colors.warning }}>{'★'.repeat(experience.rating)}</Text>
        </View>
        {!isOwner && matchScore.data && (
          <MatchScoreBadge
            matchPercent={matchScore.data.matchPercent}
            vectorA={profile?.travelStyle}
            vectorB={experience.categoryScores}
            detailTitle={experience.title}
          />
        )}
      </View>

      {isOwner && experience.notes ? (
        <Card padded>
          <Text style={[t.type.subtitle, { marginBottom: spacing.xxs }]}>Your notes</Text>
          <Text style={t.type.body}>{experience.notes}</Text>
        </Card>
      ) : null}

      <View style={{ alignItems: 'center', gap: spacing.xs }}>
        <Text style={t.type.subtitle}>Category profile</Text>
        <TravelStyleRadar series={[{ vector: experience.categoryScores }]} highlightTop size={280} />
      </View>

      {!isOwner && (
        <Pressable
          onPress={toggleSave}
          style={{
            alignSelf: 'center',
            paddingVertical: spacing.xs,
            paddingHorizontal: spacing.lg,
            borderRadius: radius.pill,
            backgroundColor: saved ? t.colors.accent : t.colors.accentMuted,
          }}
        >
          <Text style={[t.type.subtitle, { color: saved ? t.colors.textOnAccent : t.colors.accent }]}>
            {saved ? 'Saved' : 'Save'}
          </Text>
        </Pressable>
      )}
    </ScreenContainer>
  );
}
