import { Text, View } from 'react-native';
import type { PlannedTripStatus } from '../../../repositories/types';
import { spacing, useTheme } from '../../../theme';

const ORDER: PlannedTripStatus[] = ['planning', 'upcoming', 'completed'];
const LABEL: Record<PlannedTripStatus, string> = {
  planning: 'Planning',
  upcoming: 'Upcoming',
  completed: 'Completed',
};

/** Planning → Upcoming → Completed as a 3-step progress indicator
 * (brief §3.3), not a bare text label. Planner uses the warm accent. */
export function StatusSteps({ status }: { status: PlannedTripStatus }) {
  const t = useTheme();
  const currentIdx = ORDER.indexOf(status);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xxs }}>
      {ORDER.map((s, i) => {
        const done = i <= currentIdx;
        return (
          <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xxs }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: done ? t.colors.accentWarm : t.colors.border,
              }}
            />
            <Text
              style={[
                t.type.caption,
                { color: i === currentIdx ? t.colors.accentWarmText : t.colors.textSecondary },
              ]}
            >
              {LABEL[s]}
            </Text>
            {i < ORDER.length - 1 && (
              <View
                style={{
                  width: 16,
                  height: 2,
                  backgroundColor: i < currentIdx ? t.colors.accentWarm : t.colors.border,
                }}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}
