import { Image, Pressable, Text, View } from 'react-native';
import { Button } from '../../../components/Button';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { colors, spacing, typography } from '../../../theme';
import { useTrip } from '../hooks/useTrips';
import { useTripExperiences } from '../hooks/useExperiences';

interface TripDetailScreenProps {
  route: { params: { tripId: string } };
  navigation: {
    navigate: (screen: 'CreateExperience' | 'ExperienceDetail', params?: Record<string, unknown>) => void;
  };
}

export function TripDetailScreen({ route, navigation }: TripDetailScreenProps) {
  const { tripId } = route.params;
  const { data: trip } = useTrip(tripId);
  const { data: experiences = [] } = useTripExperiences(tripId);

  if (!trip) return null;

  return (
    <ScreenContainer>
      {trip.coverPhotoUrl ? (
        <Image source={{ uri: trip.coverPhotoUrl }} style={{ width: '100%', height: 180, borderRadius: 12 }} />
      ) : null}

      <View>
        <Text style={typography.displayMd}>{trip.name}</Text>
        <Text style={typography.bodySmall}>
          {trip.startDate.toDateString()} – {trip.endDate.toDateString()}
        </Text>
      </View>

      <Button label="Add experience to this trip" variant="secondary" onPress={() => navigation.navigate('CreateExperience', { tripId })} />

      <View style={{ gap: spacing.sm }}>
        {experiences.map((experience) => (
          <Pressable
            key={experience.experienceId}
            style={{ paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}
            onPress={() => navigation.navigate('ExperienceDetail', { experienceId: experience.experienceId })}
          >
            <Text style={typography.subtitle}>{experience.title}</Text>
            <Text style={typography.bodySmall}>
              {experience.city} · {experience.date.toDateString()}
            </Text>
          </Pressable>
        ))}
        {experiences.length === 0 && <Text style={typography.body}>No experiences yet.</Text>}
      </View>
    </ScreenContainer>
  );
}
