import { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { radius, spacing, useTheme } from '../theme';

interface TextFieldProps extends TextInputProps {
  /** Omit for a compact, placeholder-only field (e.g. a search bar). */
  label?: string;
  error?: string;
}

export function TextField({ label, error, style, onFocus, onBlur, multiline, ...rest }: TextFieldProps) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? t.colors.danger : focused ? t.colors.accent : t.colors.border;

  return (
    <View style={styles.container}>
      {label ? <Text style={[t.type.label, { color: t.colors.textSecondary }]}>{label}</Text> : null}
      <TextInput
        multiline={multiline}
        // Only the font family + size from the type scale — NOT its
        // `lineHeight`. A `lineHeight` on a <TextInput> makes RN mis-place
        // the text vertically (it sinks toward the bottom and the descenders
        // clip while typing); the input's own line box centres correctly
        // without it.
        style={[
          styles.input,
          {
            fontFamily: t.type.body.fontFamily,
            fontSize: t.type.body.fontSize,
            color: t.colors.textPrimary,
            backgroundColor: t.colors.surface,
            borderColor,
          },
          multiline ? styles.multiline : styles.singleLine,
          style,
        ]}
        textAlignVertical={multiline ? 'top' : 'center'}
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
  },
  singleLine: {
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  multiline: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    minHeight: 96,
  },
});
