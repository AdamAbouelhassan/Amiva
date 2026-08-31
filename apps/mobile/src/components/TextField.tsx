import { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { radius, spacing, useTheme } from '../theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function TextField({ label, error, style, onFocus, onBlur, ...rest }: TextFieldProps) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? t.colors.danger : focused ? t.colors.accent : t.colors.border;

  return (
    <View style={styles.container}>
      <Text style={[t.type.label, { color: t.colors.textSecondary }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          t.type.body,
          { backgroundColor: t.colors.surface, borderColor },
          style,
        ]}
        placeholderTextColor={t.colors.textSecondary}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
      {error ? <Text style={[t.type.caption, { color: t.colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xxs },
  input: {
    borderWidth: 1.5,
    borderRadius: radius.chip,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
});
