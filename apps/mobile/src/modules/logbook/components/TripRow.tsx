import { Image, Pressable, Text, View } from 'react-native';
import { TripDoc } from '../../../repositories/types';
import { radius, spacing, useTheme } from '../../../theme';

export function fmtTripRange(a: Date, b: Date): string {
  return `${a.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${b.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
}

export function TripRow({ trip, onPress }: { trip: TripDoc; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        gap: spacing.sm,
        alignItems: 'center',
        backgroundColor: t.colors.surface,
        borderWidth: 1,
        borderColor: t.colors.border,
        borderRadius: radius.card,
        padding: spacing.sm,
      }}
    >
      {trip.coverPhotoUrl ? (
        <Image
          source={{ uri: trip.coverPhotoUrl }}
          style={{ width: 56, height: 56, borderRadius: radius.chip, backgroundColor: t.colors.surfaceAlt }}
        />
      ) : (
        <View style={{ width: 56, height: 56, borderRadius: radius.chip, backgroundColor: t.colors.surfaceAlt }} />
      )}
      <View style={{ flex: 1 }}>
        <Text style={t.type.subtitle} numberOfLines={1}>
          {trip.name}
        </Text>
        <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]} numberOfLines={1}>
          {trip.location} · {fmtTripRange(trip.startDate, trip.endDate)}
        </Text>
      </View>
    </Pressable>
  );
}
