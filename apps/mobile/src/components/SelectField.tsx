/**
 * A minimal dropdown select — a bordered field showing the current choice
 * that expands an inline, internally-scrolling option list on tap. Matches
 * the collapse/expand pattern of `DateField` / `DateRangeField`. Use it
 * instead of a chip row wherever the option count can grow unbounded.
 */
import { useState } from 'react';
import { LayoutAnimation, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, useTheme } from '../theme';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface SelectOption<T> {
  value: T;
  label: string;
}

interface SelectFieldProps<T> {
  label?: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
}

export function SelectField<T extends string | undefined>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select',
}: SelectFieldProps<T>) {
  const t = useTheme();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);

  const animate = () => {
    if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const selected = options.find((o) => o.value === value);

  return (
    <View style={{ gap: spacing.xxs }}>
      {label ? <Text style={[t.type.label, { color: t.colors.textSecondary }]}>{label}</Text> : null}

      <Pressable
        onPress={() => {
          animate();
          setOpen((v) => !v);
        }}
        style={[
          styles.field,
          { backgroundColor: t.colors.surface, borderColor: open ? t.colors.accent : t.colors.border },
        ]}
      >
        <Text
          style={[t.type.body, { color: selected ? t.colors.textPrimary : t.colors.textSecondary, flex: 1 }]}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Text style={[t.type.body, { color: t.colors.textSecondary }]}>{open ? '▲' : '▼'}</Text>
      </Pressable>

      {open ? (
        <View style={[styles.menu, { borderColor: t.colors.border, backgroundColor: t.colors.surface }]}>
          <ScrollView style={{ maxHeight: 220 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {options.map((o, i) => {
              const isSelected = o.value === value;
              return (
                <Pressable
                  key={String(o.value ?? '__none__')}
                  onPress={() => {
                    animate();
                    onChange(o.value);
                    setOpen(false);
                  }}
                  style={{
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                    borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                    borderTopColor: t.colors.border,
                    backgroundColor: isSelected ? t.colors.accentMuted : 'transparent',
                  }}
                >
                  <Text style={[t.type.body, { color: isSelected ? t.colors.accent : t.colors.textPrimary }]}>
                    {o.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderRadius: radius.chip,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  menu: { borderWidth: 1, borderRadius: radius.chip, overflow: 'hidden' },
});
