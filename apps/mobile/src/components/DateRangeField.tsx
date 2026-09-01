/**
 * Minimal date-range field. Collapsed, it's a single row showing the
 * range; tapping expands one `RangeCalendar` where the user picks the
 * start and end on the same month grid (Google-Flights style).
 */
import { useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, useTheme } from '../theme';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { RangeCalendar } from './RangeCalendar';

interface DateRangeFieldProps {
  label?: string;
  startDate: Date;
  endDate: Date;
  onChange: (range: { startDate: Date; endDate: Date }) => void;
  minimumDate?: Date;
}

function fmt(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function DateRangeField({ label, startDate, endDate, onChange, minimumDate }: DateRangeFieldProps) {
  const t = useTheme();
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => {
          if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setExpanded((v) => !v);
        }}
        style={[
          styles.header,
          { backgroundColor: t.colors.surface, borderColor: expanded ? t.colors.accent : t.colors.border },
        ]}
      >
        <View style={{ gap: 2 }}>
          <Text style={[t.type.label, { color: t.colors.textSecondary }]}>{label ?? 'Dates'}</Text>
          <Text style={t.type.body}>
            {fmt(startDate)} – {fmt(endDate)}
          </Text>
        </View>
        <Text style={[t.type.body, { color: t.colors.textSecondary }]}>{expanded ? '▲' : '▼'}</Text>
      </Pressable>

      {expanded ? (
        <RangeCalendar
          startDate={startDate}
          endDate={endDate}
          onChange={onChange}
          minimumDate={minimumDate}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: radius.chip,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 56,
  },
});
