import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Image, ScrollView, Text, View } from 'react-native';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { MatchScoreBadge } from '../../../components/MatchScoreBadge';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TravelStyleRadar } from '../../../components/TravelStyleRadar';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useLogExperienceNav } from '../../../hooks/useLogExperienceNav';
import { useMatchScore } from '../../../hooks/useMatchScore';
import { useRefresh } from '../../../hooks/useRefresh';
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
  const queryClient = useQueryClient();
  const { data: experience } = useExperience(experienceId);
  const logNav = useLogExperienceNav();
  const refresh = useRefresh();
  const navigation = useNavigation<{ navigate: (screen: 'EditExperience', params: { experienceId: string }) => void }>();

  const matchScore = useMatchScore(
    profile ? { type: 'user', userId: profile.uid } : undefined,
    { type: 'experience', experienceId },
  );

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saves'] });
      queryClient.invalidateQueries({ queryKey: ['experiences', 'saved'] });
    },
  });

  if (!experience) return null;
  const isOwner = profile?.uid === experience.ownerId;
  const saved = !!savedQuery.data;

  return (
    <ScreenContainer onRefresh={refresh.onRefresh} refreshing={refresh.refreshing}>
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
        {isOwner ? (
          <Button
            label="Edit"
            variant="secondary"
            onPress={() => navigation.navigate('EditExperience', { experienceId })}
          />
        ) : matchScore.data ? (
          <MatchScoreBadge
            matchPercent={matchScore.data.matchPercent}
            vectorA={profile?.travelStyle}
            vectorB={experience.categoryScores}
            detailTitle={experience.title}
          />
        ) : null}
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
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Button
                label={saved ? 'Saved' : 'Save'}
                variant={saved ? 'primary' : 'secondary'}
                onPress={() => toggleSave.mutate()}
                loading={toggleSave.isPending}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Log this experience" onPress={() => logNav.fromExperience(experience)} loading={logNav.preparing} />
            </View>
          </View>
          <Text style={[t.type.caption, { color: t.colors.textSecondary, textAlign: 'center' }]}>
            Been here too? “Log this experience” starts a logbook entry pre-filled with the place and category profile.
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}
