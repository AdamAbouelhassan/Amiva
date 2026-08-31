import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { spacing, useTheme } from '../theme';

interface SectionProps {
  title?: string;
  hint?: string;
  children: ReactNode;
}

/** A titled group of settings/content rows — consistent spacing so screens
 * don't each invent their own. */
export function Section({ title, hint, children }: SectionProps) {
  const t = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      {title ? <Text style={t.type.subtitle}>{title}</Text> : null}
      {hint ? <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]}>{hint}</Text> : null}
      {children}
    </View>
  );
}
