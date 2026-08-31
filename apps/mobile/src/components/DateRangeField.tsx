/**
 * Minimal date-range field. Collapsed, it's a single row showing the
 * range; tapping expands two `DateField`s (start / end). The end picker
 * always opens at (and can't go before) the start date.
 */
import { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, useTheme } from '../theme';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { DateField } from './DateField';

interface DateRangeFieldProps {
  label?: string;
  startDate: Date;
  endDate: Date;
  onChange: (range: { startDate: Date; endDate: Date }) => void;
}

function fmt(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function DateRangeField({ label, startDate, endDate, onChange }: DateRangeFieldProps) {
  const t = useTheme();
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);

  const animate = () => {
    if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const setStart = (d: Date | null) => {
    if (!d) return;
    // Keep the end on/after the new start — this also makes the end picker
    // open at the start date the first time the user touches it.
    const nextEnd = endDate.getTime() < d.getTime() ? d : endDate;
    onChange({ startDate: d, endDate: nextEnd });
  };

  const setEnd = (d: Date | null) => {
    if (!d) return;
    onChange({ startDate, endDate: d.getTime() < startDate.getTime() ? startDate : d });
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => {
          animate();
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
        <View style={[styles.body, Platform.OS === 'ios' ? undefined : styles.bodyRow]}>
          <View style={{ flex: 1 }}>
            <DateField label="Start" value={startDate} onChange={setStart} />
          </View>
          <View style={{ flex: 1 }}>
            <DateField label="End" value={endDate} onChange={setEnd} minimumDate={startDate} />
          </View>
        </View>
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
  body: { gap: spacing.sm },
  bodyRow: { flexDirection: 'row' },
});
