import { useEffect, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { MatchBadge } from '../../../components/MatchBadge';
import { RadarChart } from '../../../components/RadarChart';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useMatchScore } from '../../../hooks/useMatchScore';
import { SaveRepository } from '../../../repositories/saveRepository';
import { colors, spacing, typography } from '../../../theme';
import { useExperience } from '../hooks/useExperiences';

interface ExperienceDetailScreenProps {
  route: { params: { experienceId: string } };
}

export function ExperienceDetailScreen({ route }: ExperienceDetailScreenProps) {
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
    if (saved) {
      await SaveRepository.unsave(profile.uid, experienceId);
    } else {
      await SaveRepository.save(profile.uid, experienceId);
    }
    setSaved(!saved);
  }

  return (
    <ScreenContainer>
      {experience.photoUrls.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ gap: spacing.xs }}>
          {experience.photoUrls.map((url) => (
            <Image key={url} source={{ uri: url }} style={{ width: 280, height: 200, borderRadius: 12, marginRight: spacing.sm }} />
          ))}
        </ScrollView>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={typography.displayMd}>{experience.title}</Text>
          <Text style={typography.bodySmall}>
            {experience.city}, {experience.country} · {experience.date.toDateString()}
          </Text>
          <Text style={{ color: colors.accent }}>{'★'.repeat(experience.rating)}</Text>
        </View>
        {!isOwner && matchScore.data && <MatchBadge matchPercent={matchScore.data.matchPercent} />}
      </View>

      {isOwner && experience.notes ? (
        <View>
          <Text style={typography.subtitle}>Your notes</Text>
          <Text style={typography.body}>{experience.notes}</Text>
        </View>
      ) : null}

      <View style={{ alignItems: 'center' }}>
        <Text style={typography.subtitle}>Category profile</Text>
        <RadarChart series={[{ vector: experience.categoryScores, color: colors.accent }]} />
      </View>

      {!isOwner && (
        <Text onPress={toggleSave} style={[typography.subtitle, { color: colors.accent, textAlign: 'center' }]}>
          {saved ? '✓ Saved' : 'Save'}
        </Text>
      )}
    </ScreenContainer>
  );
}
