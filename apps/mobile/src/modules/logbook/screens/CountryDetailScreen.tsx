/**
 * Everything logged in one country — its trips, then a Country→City→
 * Experience drill-down of standalone experiences
 * (functional_specification.md §3.1).
 */
import { useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { BrandEmptyState } from '../../../components/BrandEmptyState';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useRefresh } from '../../../hooks/useRefresh';
import { useTabBarInset } from '../../../hooks/useTabBarInset';
import { LogbookStackParamList } from '../../../navigation/types';
import { TripDoc } from '../../../repositories/types';
import { spacing, useTheme } from '../../../theme';
import { TripRow } from '../components/TripRow';
import { useLogbookDrilldown } from '../hooks/useLogbookDrilldown';
import { useTrips } from '../hooks/useTrips';

interface CountryDetailScreenProps {
  route: { params: { country: string } };
  navigation: {
    navigate: <T extends keyof LogbookStackParamList>(screen: T, params?: LogbookStackParamList[T]) => void;
  };
}

type Row =
  | { kind: 'header'; id: string; label: string }
  | { kind: 'trip'; id: string; trip: TripDoc }
  | { kind: 'city'; id: string; city: string };

export function CountryDetailScreen({ route, navigation }: CountryDetailScreenProps) {
  const t = useTheme();
  const { country } = route.params;
  const { profile } = useCurrentUser();
  const refresh = useRefresh();
  const tabInset = useTabBarInset();
  const { data: trips = [] } = useTrips(profile?.uid);
  const { countries } = useLogbookDrilldown(profile?.uid);

  const countryTrips = useMemo(
    () => trips.filter((trip) => (trip.country || trip.location) === country),
    [trips, country],
  );
  const summary = countries.find((c) => c.country === country);

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    if (countryTrips.length > 0) {
      out.push({ kind: 'header', id: 'h-trips', label: 'Trips' });
      for (const trip of countryTrips) {
        out.push({ kind: 'trip', id: `trip-${trip.tripId}`, trip });
      }
    }
    const cities = summary?.cities ?? [];
    if (cities.length > 0) {
      out.push({ kind: 'header', id: 'h-cities', label: 'Cities' });
      for (const city of cities) {
        out.push({ kind: 'city', id: `city-${city}`, city });
      }
    }
    return out;
  }, [countryTrips, summary]);

  return (
    <ScreenContainer scroll={false}>
      <View style={{ padding: spacing.screen, paddingBottom: spacing.xs }}>
        <Text style={t.type.displayMd}>{country}</Text>
        <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]}>
          {countryTrips.length} {countryTrips.length === 1 ? 'trip' : 'trips'} ·{' '}
          {summary?.experienceCount ?? 0} experiences
        </Text>
      </View>

      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.lg + tabInset, gap: spacing.sm }}
        data={rows}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refresh.refreshing}
            onRefresh={refresh.onRefresh}
            tintColor={t.colors.accent}
            colors={[t.colors.accent]}
          />
        }
        ListEmptyComponent={
          <BrandEmptyState title={`Nothing in ${country} yet`} body="Add a trip or log an experience here." />
        }
        renderItem={({ item }) => {
          if (item.kind === 'header') return <Text style={[t.type.label, { marginTop: spacing.sm }]}>{item.label}</Text>;
          if (item.kind === 'trip')
            return (
              <TripRow
                trip={item.trip}
                onPress={() => navigation.navigate('TripDetail', { tripId: item.trip.tripId })}
              />
            );
          return (
            <Pressable
              style={{ paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: t.colors.border }}
              onPress={() => navigation.navigate('CityDetail', { country, city: item.city })}
            >
              <Text style={t.type.subtitle}>{item.city}</Text>
            </Pressable>
          );
        }}
      />
    </ScreenContainer>
  );
}
