/**
 * Logbook home — trips list + Country drill-down + a chronological
 * timeline of trips *and* experiences (functional_specification.md §3.1,
 * §3.5).
 */
import { useDeferredValue, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { BrandEmptyState } from '../../../components/BrandEmptyState';
import { Button } from '../../../components/Button';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { TabPanes } from '../../../components/TabPanes';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useRefresh } from '../../../hooks/useRefresh';
import { useTabBarInset } from '../../../hooks/useTabBarInset';
import { LogbookStackParamList } from '../../../navigation/types';
import { ExperienceDoc, TripDoc } from '../../../repositories/types';
import { radius, spacing, useTheme } from '../../../theme';
import { ExperienceRow } from '../components/ExperienceRow';
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
  const tabInset = useTabBarInset();
  const [tab, setTab] = useState<Tab>('trips');
  // Segmented control reacts instantly; the pane swap is deferred so it
  // never blocks the tap (the cross-dissolve itself runs on the UI thread).
  const deferredTab = useDeferredValue(tab);

  const makeRC = () => (
    <RefreshControl
      refreshing={refresh.refreshing}
      onRefresh={refresh.onRefresh}
      tintColor={t.colors.accent}
      colors={[t.colors.accent]}
    />
  );
  const listPad = { paddingHorizontal: spacing.screen, paddingBottom: spacing.lg + tabInset };

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
    <ScreenContainer scroll={false} safeAreaTop>
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
            { value: 'timeline', label: 'Timeline' },
            { value: 'countries', label: 'By country' },
            ]}
        />
      </View>

      <TabPanes
        activeKey={deferredTab}
        panes={[
          {
            key: 'trips',
            node: (
              <FlatList
                style={{ flex: 1 }}
                contentContainerStyle={{ ...listPad, gap: spacing.sm }}
                data={trips}
                keyExtractor={(item) => item.tripId}
                refreshControl={makeRC()}
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
            ),
          },
          {
            key: 'countries',
            node: (
              <FlatList
                style={{ flex: 1 }}
                contentContainerStyle={listPad}
                data={countryRows}
                keyExtractor={(item) => item.country}
                refreshControl={makeRC()}
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
            ),
          },
          {
            key: 'timeline',
            node: (
              <FlatList
                style={{ flex: 1 }}
                contentContainerStyle={{ ...listPad, gap: spacing.sm }}
                data={timeline}
                keyExtractor={(item) => `${item.kind}:${item.id}`}
                refreshControl={makeRC()}
                ListEmptyComponent={
                  !loading ? (
                    <BrandEmptyState title="Nothing logged yet" body="Your timeline fills in as you log trips and experiences." />
                  ) : null
                }
                renderItem={({ item }) =>
                  item.kind === 'trip' ? (
                    <TripRow trip={item.trip} onPress={() => navigation.navigate('TripDetail', { tripId: item.trip.tripId })} />
                  ) : (
                    <ExperienceRow
                      experience={item.exp}
                      onPress={() => navigation.navigate('ExperienceDetail', { experienceId: item.exp.experienceId })}
                    />
                  )
                }
              />
            ),
          },
        ]}
      />
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
