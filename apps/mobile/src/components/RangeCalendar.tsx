/**
 * A single-calendar date-range picker (Google-Flights style): tap once for
 * the start, tap again for the end. Tapping a third time starts a fresh
 * range. Month is navigated with ‹ ›. This is the range primitive — the
 * only range UI in the app — and it uses no native picker, so it looks
 * identical on iOS and Android.
 */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, useTheme } from '../theme';

interface RangeCalendarProps {
  startDate: Date;
  endDate: Date;
  onChange: (range: { startDate: Date; endDate: Date }) => void;
  minimumDate?: Date;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function monthLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

/** Cells for one month grid — `null` for the leading/trailing blanks. */
function monthGrid(month: Date): (Date | null)[] {
  const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const lead = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const cells: (Date | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= total; d += 1) cells.push(new Date(month.getFullYear(), month.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function RangeCalendar({ startDate, endDate, onChange, minimumDate }: RangeCalendarProps) {
  const t = useTheme();
  const [viewMonth, setViewMonth] = useState(() => new Date(startDate.getFullYear(), startDate.getMonth(), 1));
  // Set while we wait for the second (end) tap.
  const [anchor, setAnchor] = useState<Date | null>(null);

  const min = minimumDate ? startOfDay(minimumDate) : null;
  const s = startOfDay(startDate);
  const e = startOfDay(endDate);
  const cells = useMemo(() => monthGrid(viewMonth), [viewMonth]);

  const press = (day: Date) => {
    if (min && day.getTime() < min.getTime()) return;
    if (!anchor) {
      setAnchor(day);
      onChange({ startDate: day, endDate: day });
      return;
    }
    if (day.getTime() < anchor.getTime()) onChange({ startDate: day, endDate: anchor });
    else onChange({ startDate: anchor, endDate: day });
    setAnchor(null);
  };

  return (
    <View style={[styles.container, { borderColor: t.colors.border, backgroundColor: t.colors.surface }]}>
      <View style={styles.header}>
        <Pressable onPress={() => setViewMonth((m) => addMonths(m, -1))} hitSlop={12} style={styles.nav}>
          <Text style={[t.type.displayMd, { color: t.colors.accent }]}>‹</Text>
        </Pressable>
        <Text style={t.type.subtitle}>{monthLabel(viewMonth)}</Text>
        <Pressable onPress={() => setViewMonth((m) => addMonths(m, 1))} hitSlop={12} style={styles.nav}>
          <Text style={[t.type.displayMd, { color: t.colors.accent }]}>›</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        {WEEKDAYS.map((w, i) => (
          <Text key={i} style={[t.type.caption, styles.weekday, { color: t.colors.textSecondary }]}>
            {w}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={i} style={styles.cell} />;
          const inRange = day.getTime() >= s.getTime() && day.getTime() <= e.getTime();
          const endpoint = sameDay(day, s) || sameDay(day, e);
          const disabled = !!min && day.getTime() < min.getTime();
          return (
            <View key={i} style={styles.cell}>
              <Pressable
                onPress={() => press(day)}
                disabled={disabled}
                style={[
                  styles.day,
                  {
                    borderRadius: endpoint ? 999 : radius.chip - 4,
                    backgroundColor: endpoint
                      ? t.colors.accent
                      : inRange
                        ? t.colors.accentMuted
                        : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    t.type.body,
                    {
                      color: endpoint ? t.colors.textOnAccent : t.colors.textPrimary,
                      opacity: disabled ? 0.3 : 1,
                    },
                  ]}
                >
                  {day.getDate()}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: radius.chip,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  nav: { width: 40, alignItems: 'center' },
  row: { flexDirection: 'row' },
  weekday: { width: `${100 / 7}%`, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
  day: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
