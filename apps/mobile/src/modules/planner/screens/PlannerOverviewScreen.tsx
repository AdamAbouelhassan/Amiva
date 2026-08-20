import { FlatList, Pressable, Text, View } from 'react-native';
import { Button } from '../../../components/Button';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { colors, spacing, typography } from '../../../theme';
import { usePlannedTrips } from '../hooks/usePlannedTrips';

interface PlannerOverviewScreenProps {
  navigation: {
    navigate: (screen: 'CreatePlannedTrip' | 'PlannedTripDetail', params?: Record<string, unknown>) => void;
  };
}

const STATUS_LABEL: Record<string, string> = { planning: 'Planning', upcoming: 'Upcoming', completed: 'Completed' };

export function PlannerOverviewScreen({ navigation }: PlannerOverviewScreenProps) {
  const { data: trips = [], isLoading } = usePlannedTrips();

  return (
    <ScreenContainer scroll={false}>
      <View style={{ padding: spacing.lg, gap: spacing.sm }}>
        <Text style={typography.displayMd}>Planner</Text>
        <Button label="New planned trip" onPress={() => navigation.navigate('CreatePlannedTrip')} />
      </View>

      <FlatList
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        data={trips}
        keyExtractor={(item) => item.plannedTripId}
        refreshing={isLoading}
        ListEmptyComponent={!isLoading ? <Text style={typography.body}>No planned trips yet.</Text> : null}
        renderItem={({ item }) => (
          <Pressable
            style={{ paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}
            onPress={() => navigation.navigate('PlannedTripDetail', { plannedTripId: item.plannedTripId })}
          >
            <Text style={typography.subtitle}>{item.locations.join(', ')}</Text>
            <Text style={typography.bodySmall}>
              {item.startDate.toDateString()} – {item.endDate.toDateString()} · {STATUS_LABEL[item.status]}
            </Text>
          </Pressable>
        )}
      />
    </ScreenContainer>
  );
}
