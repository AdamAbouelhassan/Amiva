import { useNavigation } from '@react-navigation/native';
import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppImage } from '../../../components/AppImage';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { IconButton } from '../../../components/IconButton';
import { MatchScoreBadge } from '../../../components/MatchScoreBadge';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TravelStyleRadar } from '../../../components/TravelStyleRadar';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useLogExperienceNav } from '../../../hooks/useLogExperienceNav';
import { useMatchScore } from '../../../hooks/useMatchScore';
import { useRefresh } from '../../../hooks/useRefresh';
import { useSaveToggle } from '../../../hooks/useSaves';
import { openInGoogleMaps } from '../../../lib/mapsUrl';
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
  const logNav = useLogExperienceNav();
  const refresh = useRefresh();
  const save = useSaveToggle(experienceId);
  const navigation = useNavigation<{ navigate: (screen: 'EditExperience', params: { experienceId: string }) => void }>();

  const matchScore = useMatchScore(
    profile ? { type: 'user', userId: profile.uid } : undefined,
    { type: 'experience', experienceId },
  );

  if (!experience) return null;
  const isOwner = profile?.uid === experience.ownerId;
  const saved = save.saved;

  const hasPhotos = experience.photoUrls.length > 0;

  return (
    <ScreenContainer onRefresh={refresh.onRefresh} refreshing={refresh.refreshing}>
      {hasPhotos ? (
        <View style={{ width: 280, alignSelf: 'center' }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={280 + spacing.sm}
            decelerationRate="fast"
          >
            {experience.photoUrls.map((url) => (
              <AppImage
                key={url}
                uri={url}
                style={{ width: 280, height: 200, borderRadius: radius.card, marginRight: spacing.sm }}
              />
            ))}
          </ScrollView>
          {/* Non-owner actions ride the photo: match % top-right, Save
              top-left — keeps the title line clear. */}
          {!isOwner ? (
            <>
              {matchScore.data ? (
                <View style={{ position: 'absolute', top: spacing.xs, right: spacing.xs }}>
                  <MatchScoreBadge
                    matchPercent={matchScore.data.matchPercent}
                    vectorA={profile?.travelStyle}
                    vectorB={experience.categoryScores}
                    detailTitle={experience.title}
                  />
                </View>
              ) : null}
              <View style={{ position: 'absolute', top: spacing.xs, left: spacing.xs }}>
                <IconButton
                  variant="overlay"
                  name={saved ? 'bookmark' : 'bookmark-outline'}
                  active={saved}
                  onPress={save.toggle}
                  accessibilityLabel={saved ? 'Saved' : 'Save'}
                />
              </View>
            </>
          ) : null}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Text style={t.type.displayMd}>{experience.title}</Text>
          {experience.placeName ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Ionicons name="location" size={13} color={t.colors.accent} />
              <Text style={[t.type.bodySmall, { color: t.colors.textPrimary }]} numberOfLines={1}>
                {experience.placeName}
              </Text>
            </View>
          ) : null}
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
        ) : !hasPhotos ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            {matchScore.data ? (
              <MatchScoreBadge
                matchPercent={matchScore.data.matchPercent}
                vectorA={profile?.travelStyle}
                vectorB={experience.categoryScores}
                detailTitle={experience.title}
              />
            ) : null}
            <IconButton
              name={saved ? 'bookmark' : 'bookmark-outline'}
              active={saved}
              onPress={save.toggle}
              accessibilityLabel={saved ? 'Saved' : 'Save'}
            />
          </View>
        ) : null}
      </View>

      <Button
        label="Open in Maps"
        variant="secondary"
        onPress={() =>
          openInGoogleMaps({
            name: experience.title,
            city: experience.city,
            country: experience.country,
            placeId: experience.placeId,
          })
        }
      />

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
          <Button
            label="Log this experience"
            onPress={() => logNav.fromExperience(experience)}
            loading={logNav.preparing}
          />
          <Text style={[t.type.caption, { color: t.colors.textSecondary, textAlign: 'center' }]}>
            Been here too? “Log this experience” starts a logbook entry pre-filled with the place and category profile.
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}
