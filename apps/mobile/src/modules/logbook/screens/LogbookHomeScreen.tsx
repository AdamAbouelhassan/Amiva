/**
 * Logbook home — Country drill-down + aggregate stats + a chronological
 * timeline toggle (functional_specification.md §3.1, §3.5).
 */
import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { BrandEmptyState } from '../../../components/BrandEmptyState';
import { Button } from '../../../components/Button';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { LogbookStackParamList } from '../../../navigation/types';
import { radius, spacing, useTheme } from '../../../theme';
import { useLogbookDrilldown } from '../hooks/useLogbookDrilldown';

interface LogbookHomeScreenProps {
  navigation: {
    navigate: <T extends keyof LogbookStackParamList>(screen: T, params?: LogbookStackParamList[T]) => void;
  };
}

type View_ = 'countries' | 'timeline';

export function LogbookHomeScreen({ navigation }: LogbookHomeScreenProps) {
  const t = useTheme();
  const { profile } = useCurrentUser();
  const { countries, stats, experiences, isLoading } = useLogbookDrilldown(profile?.uid);
  const [view, setView] = useState<View_>('countries');

  const sorted = useMemo(
    () => [...experiences].sort((a, b) => b.date.getTime() - a.date.getTime()),
    [experiences],
  );

  return (
    <ScreenContainer scroll={false}>
      <View style={{ padding: spacing.screen, gap: spacing.md }}>
        <Text style={t.type.displayMd}>Logbook</Text>

        <View
          style={{
            flexDirection: 'row',
            backgroundColor: t.colors.surface,
            borderWidth: 1,
            borderColor: t.colors.border,
            borderRadius: radius.card,
            paddingVertical: spacing.sm,
          }}
        >
          <Stat label="Countries" value={stats.countryCount} />
          <Stat label="Cities" value={stats.cityCount} />
          <Stat label="Experiences" value={stats.experienceCount} />
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button label="Log trip" variant="secondary" onPress={() => navigation.navigate('CreateTrip')} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Log experience" onPress={() => navigation.navigate('CreateExperience', undefined)} />
          </View>
        </View>

        <SegmentedControl
          value={view}
          onChange={setView}
          options={[
            { value: 'countries', label: 'By country' },
            { value: 'timeline', label: 'Timeline' },
          ]}
        />
      </View>

      {view === 'countries' ? (
        <FlatList
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.lg }}
          data={countries}
          keyExtractor={(item) => item.country}
          ListEmptyComponent={
            !isLoading ? (
              <BrandEmptyState
                title="Your logbook is empty"
                body="Log your first trip to start building your travel style."
                action={{ label: 'Log a trip', onPress: () => navigation.navigate('CreateTrip') }}
              />
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              style={{ paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: t.colors.border }}
              onPress={() =>
                item.cities[0] &&
                navigation.navigate('CityDetail', { country: item.country, city: item.cities[0] })
              }
            >
              <Text style={t.type.subtitle}>{item.country}</Text>
              <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]}>
                {item.cities.length} {item.cities.length === 1 ? 'city' : 'cities'} · {item.experienceCount} experiences
              </Text>
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.lg }}
          data={sorted}
          keyExtractor={(item) => item.experienceId}
          ListEmptyComponent={
            !isLoading ? <BrandEmptyState title="Nothing logged yet" body="Your timeline fills in as you log experiences." /> : null
          }
          renderItem={({ item }) => (
            <Pressable
              style={{ paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: t.colors.border }}
              onPress={() => navigation.navigate('ExperienceDetail', { experienceId: item.experienceId })}
            >
              <Text style={t.type.subtitle}>{item.title}</Text>
              <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]}>
                {item.city}, {item.country} · {item.date.toDateString()}
              </Text>
            </Pressable>
          )}
        />
      )}
    </ScreenContainer>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={t.type.statNumber}>{value}</Text>
      <Text style={t.type.caption}>{label}</Text>
    </View>
  );
}
