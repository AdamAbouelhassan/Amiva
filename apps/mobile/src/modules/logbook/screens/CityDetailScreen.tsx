import { FlatList, Pressable, Text } from 'react-native';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { colors, spacing, typography } from '../../../theme';
import { useCityExperiences } from '../hooks/useExperiences';

interface CityDetailScreenProps {
  route: { params: { country: string; city: string } };
  navigation: { navigate: (screen: 'ExperienceDetail', params: { experienceId: string }) => void };
}

export function CityDetailScreen({ route, navigation }: CityDetailScreenProps) {
  const { country, city } = route.params;
  const { profile } = useCurrentUser();
  const { data: experiences = [] } = useCityExperiences(profile?.uid, country, city);

  return (
    <ScreenContainer scroll={false}>
      <Text style={[typography.displayMd, { padding: spacing.lg, paddingBottom: 0 }]}>{city}</Text>
      <Text style={[typography.bodySmall, { paddingHorizontal: spacing.lg }]}>{country}</Text>
      <FlatList
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        data={experiences}
        keyExtractor={(item) => item.experienceId}
        renderItem={({ item }) => (
          <Pressable
            style={{ paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}
            onPress={() => navigation.navigate('ExperienceDetail', { experienceId: item.experienceId })}
          >
            <Text style={typography.subtitle}>{item.title}</Text>
            <Text style={typography.bodySmall}>
              {'★'.repeat(item.rating)} · {item.date.toDateString()}
            </Text>
          </Pressable>
        )}
      />
    </ScreenContainer>
  );
}
