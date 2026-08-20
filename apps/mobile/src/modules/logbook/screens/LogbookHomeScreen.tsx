/**
 * Logbook home — Country drill-down + aggregate stats + chronological
 * timeline toggle (functional_specification.md §3.1, §3.5).
 */
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Button } from '../../../components/Button';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { LogbookStackParamList } from '../../../navigation/types';
import { colors, spacing, typography } from '../../../theme';
import { useLogbookDrilldown } from '../hooks/useLogbookDrilldown';

interface LogbookHomeScreenProps {
  navigation: {
    navigate: <T extends keyof LogbookStackParamList>(screen: T, params?: LogbookStackParamList[T]) => void;
  };
}

export function LogbookHomeScreen({ navigation }: LogbookHomeScreenProps) {
  const { profile } = useCurrentUser();
  const { countries, stats, experiences, isLoading } = useLogbookDrilldown(profile?.uid);
  const [view, setView] = useState<'countries' | 'timeline'>('countries');

  const sortedExperiences = [...experiences].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <ScreenContainer scroll={false}>
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <Text style={typography.displayMd}>Logbook</Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <StatBlock label="Countries" value={stats.countryCount} />
          <StatBlock label="Cities" value={stats.cityCount} />
          <StatBlock label="Experiences" value={stats.experienceCount} />
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button label="New trip" variant="secondary" onPress={() => navigation.navigate('CreateTrip')} />
          <Button label="Log experience" onPress={() => navigation.navigate('CreateExperience', undefined)} />
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Pressable onPress={() => setView('countries')}>
            <Text style={[typography.subtitle, view === 'countries' && { color: colors.accent }]}>By country</Text>
          </Pressable>
          <Pressable onPress={() => setView('timeline')}>
            <Text style={[typography.subtitle, view === 'timeline' && { color: colors.accent }]}>Timeline</Text>
          </Pressable>
        </View>
      </View>

      {view === 'countries' ? (
        <FlatList
          contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
          data={countries}
          keyExtractor={(item) => item.country}
          renderItem={({ item }) => (
            <Pressable
              style={{ paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}
              onPress={() => item.cities[0] && navigation.navigate('CityDetail', { country: item.country, city: item.cities[0] })}
            >
              <Text style={typography.subtitle}>{item.country}</Text>
              <Text style={typography.bodySmall}>
                {item.cities.length} {item.cities.length === 1 ? 'city' : 'cities'} · {item.experienceCount} experiences
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={!isLoading ? <Text style={typography.body}>No experiences logged yet.</Text> : null}
        />
      ) : (
        <FlatList
          contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
          data={sortedExperiences}
          keyExtractor={(item) => item.experienceId}
          renderItem={({ item }) => (
            <Pressable
              style={{ paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}
              onPress={() => navigation.navigate('ExperienceDetail', { experienceId: item.experienceId })}
            >
              <Text style={typography.subtitle}>{item.title}</Text>
              <Text style={typography.bodySmall}>
                {item.city}, {item.country} · {item.date.toDateString()}
              </Text>
            </Pressable>
          )}
        />
      )}
    </ScreenContainer>
  );
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={typography.statNumber}>{value}</Text>
      <Text style={typography.caption}>{label}</Text>
    </View>
  );
}
