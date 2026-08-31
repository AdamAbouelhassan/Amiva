import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Button } from '../../../components/Button';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { useRefresh } from '../../../hooks/useRefresh';
import { LogbookStackParamList } from '../../../navigation/types';
import { radius, spacing, useTheme } from '../../../theme';
import { useTrip } from '../hooks/useTrips';
import { useTripExperiences } from '../hooks/useExperiences';

interface TripDetailScreenProps {
  route: { params: { tripId: string } };
  navigation: {
    navigate: <T extends keyof LogbookStackParamList>(screen: T, params?: LogbookStackParamList[T]) => void;
  };
}

function fmtRange(start?: Date, end?: Date): string {
  if (start && end)
    return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(
      undefined,
      { month: 'short', day: 'numeric', year: 'numeric' },
    )}`;
  if (start) return `From ${start.toDateString()}`;
  if (end) return `Until ${end.toDateString()}`;
  return 'Dates not set';
}

export function TripDetailScreen({ route, navigation }: TripDetailScreenProps) {
  const t = useTheme();
  const { tripId } = route.params;
  const { data: trip } = useTrip(tripId);
  const { data: experiences = [] } = useTripExperiences(tripId, trip?.ownerId);
  const refresh = useRefresh();

  if (!trip) return null;

  return (
    <ScreenContainer onRefresh={refresh.onRefresh} refreshing={refresh.refreshing}>
      {trip.coverPhotoUrl ? (
        <Image source={{ uri: trip.coverPhotoUrl }} style={{ width: '100%', height: 200, borderRadius: radius.card }} />
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Text style={t.type.displayMd}>{trip.name}</Text>
          <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]}>
            {trip.location} · {fmtRange(trip.startDate, trip.endDate)}
          </Text>
        </View>
        <Button label="Edit" variant="secondary" onPress={() => navigation.navigate('EditTrip', { tripId })} />
      </View>

      {trip.notes ? (
        <View style={{ gap: spacing.xxs }}>
          <Text style={t.type.label}>Notes</Text>
          <Text style={t.type.body}>{trip.notes}</Text>
        </View>
      ) : null}

      {trip.accommodation ? (
        <View style={{ gap: spacing.xxs }}>
          <Text style={t.type.label}>Accommodation</Text>
          <Text style={t.type.body}>{trip.accommodation}</Text>
        </View>
      ) : null}

      {trip.photoUrls.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
          {trip.photoUrls.map((uri) => (
            <Image key={uri} source={{ uri }} style={{ width: 120, height: 120, borderRadius: radius.chip }} />
          ))}
        </ScrollView>
      ) : null}

      <Button
        label="Add experience to this trip"
        variant="secondary"
        onPress={() => navigation.navigate('CreateExperience', { tripId })}
      />

      <View style={{ gap: spacing.xs }}>
        <Text style={t.type.label}>Experiences</Text>
        {experiences.map((experience) => (
          <Pressable
            key={experience.experienceId}
            style={{ paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: t.colors.border }}
            onPress={() => navigation.navigate('ExperienceDetail', { experienceId: experience.experienceId })}
          >
            <Text style={t.type.subtitle}>{experience.title}</Text>
            <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]}>
              {experience.city} · {experience.date.toDateString()}
            </Text>
          </Pressable>
        ))}
        {experiences.length === 0 && (
          <Text style={[t.type.body, { color: t.colors.textSecondary }]}>No experiences yet.</Text>
        )}
      </View>
    </ScreenContainer>
  );
}
