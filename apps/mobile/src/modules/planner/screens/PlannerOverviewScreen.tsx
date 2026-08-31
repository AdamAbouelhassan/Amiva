import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { BrandEmptyState } from '../../../components/BrandEmptyState';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { useRefresh } from '../../../hooks/useRefresh';
import { displayPlannedTripStatus } from '../../../lib/plannedTripStatus';
import { spacing, useTheme } from '../../../theme';
import { StatusSteps } from '../components/StatusSteps';
import { usePlannedTrips } from '../hooks/usePlannedTrips';

interface PlannerOverviewScreenProps {
  navigation: {
    navigate: (screen: 'CreatePlannedTrip' | 'PlannedTripDetail', params?: Record<string, unknown>) => void;
  };
}

export function PlannerOverviewScreen({ navigation }: PlannerOverviewScreenProps) {
  const t = useTheme();
  const refresh = useRefresh();
  const { data: trips = [], isLoading } = usePlannedTrips();

  return (
    <ScreenContainer scroll={false}>
      <View style={{ padding: spacing.screen, gap: spacing.sm }}>
        <Text style={t.type.displayMd}>Planner</Text>
        <Button label="Plan a trip" variant="warm" onPress={() => navigation.navigate('CreatePlannedTrip')} />
      </View>

      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.lg, gap: spacing.sm }}
        data={trips}
        keyExtractor={(item) => item.plannedTripId}
        refreshControl={
          <RefreshControl
            refreshing={refresh.refreshing}
            onRefresh={refresh.onRefresh}
            tintColor={t.colors.accent}
            colors={[t.colors.accent]}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <BrandEmptyState
              title="Nothing on the horizon"
              body="Plan a trip to collect saved places into an itinerary and check group compatibility."
              action={{ label: 'Plan a trip', onPress: () => navigation.navigate('CreatePlannedTrip') }}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('PlannedTripDetail', { plannedTripId: item.plannedTripId })}>
            <Card elevation="raised" style={{ gap: spacing.xs }}>
              <Text style={t.type.subtitle}>{item.name || item.location}</Text>
              <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]}>
                {item.location}
                {item.startDate && item.endDate
                  ? ` · ${item.startDate.toDateString()} – ${item.endDate.toDateString()}`
                  : ''}
              </Text>
              <StatusSteps status={displayPlannedTripStatus(item.status, item.startDate)} />
            </Card>
          </Pressable>
        )}
      />
    </ScreenContainer>
  );
}
