/**
 * Logbook home — trips list + Country drill-down + a chronological
 * timeline of trips *and* experiences (functional_specification.md §3.1,
 * §3.5).
 */
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { BrandEmptyState } from '../../../components/BrandEmptyState';
import { Button } from '../../../components/Button';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useRefresh } from '../../../hooks/useRefresh';
import { LogbookStackParamList } from '../../../navigation/types';
import { ExperienceDoc, TripDoc } from '../../../repositories/types';
import { radius, spacing, useTheme } from '../../../theme';
import { TripRow } from '../components/TripRow';
import { useLogbookDrilldown } from '../hooks/useLogbookDrilldown';
import { useTrips } from '../hooks/useTrips';

interface LogbookHomeScreenProps {
  navigation: {
    navigate: <T extends keyof LogbookStackParamList>(screen: T, params?: LogbookStackParamList[T]) => void;
  };
}

type Tab = 'trips' | 'countries' | 'timeline';

type TimelineItem =
  | { kind: 'trip'; id: string; date: Date; trip: TripDoc }
  | { kind: 'exp'; id: string; date: Date; exp: ExperienceDoc };

interface CountryRow {
  country: string;
  tripCount: number;
  experienceCount: number;
}

export function LogbookHomeScreen({ navigation }: LogbookHomeScreenProps) {
  const t = useTheme();
  const { profile } = useCurrentUser();
  const { countries, stats, experiences, isLoading } = useLogbookDrilldown(profile?.uid);
  const { data: trips = [], isLoading: tripsLoading } = useTrips(profile?.uid);
  const refresh = useRefresh();
  const [tab, setTab] = useState<Tab>('trips');

  const refreshControl = (
    <RefreshControl
      refreshing={refresh.refreshing}
      onRefresh={refresh.onRefresh}
      tintColor={t.colors.accent}
      colors={[t.colors.accent]}
    />
  );

  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [
      ...trips.map((trip) => ({ kind: 'trip' as const, id: trip.tripId, date: trip.startDate, trip })),
      ...experiences.map((exp) => ({ kind: 'exp' as const, id: exp.experienceId, date: exp.date, exp })),
    ];
    return items.sort((x, y) => y.date.getTime() - x.date.getTime());
  }, [trips, experiences]);

  // "By country" spans both trips and standalone experiences.
  const countryRows = useMemo<CountryRow[]>(() => {
    const byCountry = new Map<string, CountryRow>();
    const bump = (country: string, key: 'tripCount' | 'experienceCount', n: number) => {
      if (!country) return;
      const row = byCountry.get(country) ?? { country, tripCount: 0, experienceCount: 0 };
      row[key] += n;
      byCountry.set(country, row);
    };
    for (const c of countries) bump(c.country, 'experienceCount', c.experienceCount);
    for (const trip of trips) bump(trip.country || trip.location, 'tripCount', 1);
    return [...byCountry.values()].sort((a, b) => a.country.localeCompare(b.country));
  }, [countries, trips]);

  const loading = isLoading || tripsLoading;

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
          <Stat label="Countries" value={countryRows.length} />
          <Stat label="Trips" value={trips.length} />
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
          value={tab}
          onChange={setTab}
          options={[
            { value: 'trips', label: 'Trips' },
            { value: 'countries', label: 'By country' },
            { value: 'timeline', label: 'Timeline' },
          ]}
        />
      </View>

      {tab === 'trips' && (
        <FlatList
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.lg, gap: spacing.sm }}
          data={trips}
          keyExtractor={(item) => item.tripId}
          refreshControl={refreshControl}
          ListEmptyComponent={
            !loading ? (
              <BrandEmptyState
                title="No trips yet"
                body="Create a trip to collect experiences, photos, and notes in one place."
                action={{ label: 'Log a trip', onPress: () => navigation.navigate('CreateTrip') }}
              />
            ) : null
          }
          renderItem={({ item }) => (
            <TripRow trip={item} onPress={() => navigation.navigate('TripDetail', { tripId: item.tripId })} />
          )}
        />
      )}

      {tab === 'countries' && (
        <FlatList
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.lg }}
          data={countryRows}
          keyExtractor={(item) => item.country}
          refreshControl={refreshControl}
          ListEmptyComponent={
            !loading ? (
              <BrandEmptyState
                title="Nothing logged by country yet"
                body="Countries appear here once you add a trip or log an experience."
              />
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              style={{ paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: t.colors.border }}
              onPress={() => navigation.navigate('CountryDetail', { country: item.country })}
            >
              <Text style={t.type.subtitle}>{item.country}</Text>
              <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]}>
                {[
                  item.tripCount > 0 ? `${item.tripCount} ${item.tripCount === 1 ? 'trip' : 'trips'}` : null,
                  item.experienceCount > 0
                    ? `${item.experienceCount} ${item.experienceCount === 1 ? 'experience' : 'experiences'}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'No entries yet'}
              </Text>
            </Pressable>
          )}
        />
      )}

      {tab === 'timeline' && (
        <FlatList
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.lg, gap: spacing.xs }}
          data={timeline}
          keyExtractor={(item) => `${item.kind}:${item.id}`}
          refreshControl={refreshControl}
          ListEmptyComponent={
            !loading ? (
              <BrandEmptyState title="Nothing logged yet" body="Your timeline fills in as you log trips and experiences." />
            ) : null
          }
          renderItem={({ item }) =>
            item.kind === 'trip' ? (
              <TripRow trip={item.trip} onPress={() => navigation.navigate('TripDetail', { tripId: item.trip.tripId })} />
            ) : (
              <Pressable
                style={{ paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: t.colors.border }}
                onPress={() => navigation.navigate('ExperienceDetail', { experienceId: item.exp.experienceId })}
              >
                <Text style={t.type.subtitle}>{item.exp.title}</Text>
                <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]}>
                  {item.exp.city}, {item.exp.country} · {item.exp.date.toDateString()}
                </Text>
              </Pressable>
            )
          }
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
