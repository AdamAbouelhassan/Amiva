import { View, ViewProps } from 'react-native';
import { radius, shadow, spacing, useTheme } from '../theme';

interface CardProps extends ViewProps {
  /** 'flat' = border only; 'raised' = soft warm shadow. Vary by content
   * importance (brief §4 — no uniform-card SaaS look). */
  elevation?: 'flat' | 'raised';
  padded?: boolean;
}

export function Card({ elevation = 'flat', padded = true, style, children, ...rest }: CardProps) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t.colors.surface,
          borderRadius: radius.card,
          borderWidth: elevation === 'flat' ? 1 : 0,
          borderColor: t.colors.border,
          padding: padded ? spacing.md : 0,
        },
        elevation === 'raised' && shadow.resting,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
