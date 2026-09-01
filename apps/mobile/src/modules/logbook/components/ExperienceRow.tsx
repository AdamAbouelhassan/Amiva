import { Pressable, Text, View } from 'react-native';
import { AppImage } from '../../../components/AppImage';
import { ExperienceDoc } from '../../../repositories/types';
import { radius, spacing, useTheme } from '../../../theme';

/** A logbook experience as a thumbnail row — the same shape as `TripRow`
 * so trips and experiences read consistently in timelines and lists. */
export function ExperienceRow({
  experience,
  onPress,
  subtitle,
}: {
  experience: ExperienceDoc;
  onPress: () => void;
  /** Overrides the default `city, country · date` line. */
  subtitle?: string;
}) {
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
      <AppImage uri={experience.photoUrls[0]} style={{ width: 56, height: 56, borderRadius: radius.chip }} />
      <View style={{ flex: 1 }}>
        <Text style={t.type.subtitle} numberOfLines={1}>
          {experience.title}
        </Text>
        <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]} numberOfLines={1}>
          {subtitle ??
            `${experience.city}, ${experience.country} · ${experience.date.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}`}
        </Text>
      </View>
    </Pressable>
  );
}
