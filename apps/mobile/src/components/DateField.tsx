/**
 * Minimal date field — shows a compact, TextField-styled button with the
 * selected date (or a placeholder). The full picker only appears on tap:
 * a native dialog on Android, an inline calendar that collapses after a
 * pick on iOS (Google-Flights style). This is the single date-picker
 * primitive for the whole app — nothing else imports
 * `@react-native-community/datetimepicker` directly.
 */
import { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { radius, spacing, useTheme } from '../theme';
import { useReducedMotion } from '../hooks/useReducedMotion';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface DateFieldProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  clearable?: boolean;
}

function fmt(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Select a date',
  minimumDate,
  maximumDate,
  clearable,
}: DateFieldProps) {
  const t = useTheme();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);

  const animate = () => {
    if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const commit = (_event: DateTimePickerEvent, next?: Date) => {
    if (next) onChange(next);
  };

  const openPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: value ?? new Date(),
        mode: 'date',
        minimumDate,
        maximumDate,
        onChange: (event, next) => {
          if (event.type === 'set' && next) onChange(next);
        },
      });
      return;
    }
    animate();
    setOpen((v) => !v);
  };

  return (
    <View style={styles.container}>
      {label ? <Text style={[t.type.label, { color: t.colors.textSecondary }]}>{label}</Text> : null}
      <Pressable
        onPress={openPicker}
        style={[
          styles.field,
          { backgroundColor: t.colors.surface, borderColor: open ? t.colors.accent : t.colors.border },
        ]}
      >
        <Text style={[t.type.body, { color: value ? t.colors.textPrimary : t.colors.textSecondary }]}>
          {value ? fmt(value) : placeholder}
        </Text>
        {clearable && value ? (
          <Pressable
            hitSlop={10}
            onPress={() => {
              animate();
              setOpen(false);
              onChange(null);
            }}
          >
            <Text style={[t.type.body, { color: t.colors.textSecondary }]}>×</Text>
          </Pressable>
        ) : null}
      </Pressable>

      {Platform.OS === 'ios' && open ? (
        <View style={[styles.inline, { borderColor: t.colors.border, backgroundColor: t.colors.surface }]}>
          <DateTimePicker
            value={value ?? new Date()}
            mode="date"
            display="inline"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onChange={commit}
          />
          <Pressable
            onPress={() => {
              animate();
              setOpen(false);
            }}
            style={styles.done}
          >
            <Text style={[t.type.label, { color: t.colors.accent }]}>Done</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xxs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: radius.chip,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  inline: {
    borderWidth: 1,
    borderRadius: radius.chip,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
  },
  done: { alignSelf: 'flex-end', paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
});
