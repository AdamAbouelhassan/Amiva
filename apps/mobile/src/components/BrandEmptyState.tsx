import { View } from 'react-native';
import { Text } from 'react-native';
import { spacing, useTheme } from '../theme';
import { Button } from './Button';
import { BrandMark } from './icons/BrandMark';

interface BrandEmptyStateProps {
  /** Active-voice, tells the user exactly what to do next (brief §4). */
  title: string;
  body?: string;
  action?: { label: string; onPress: () => void };
  /** 'error' tints the headline; default is a neutral empty state. */
  tone?: 'empty' | 'error';
}

/** Every empty / error / first-run state: the brand glyph faded large
 * behind a direct prompt — never a generic "nothing here" (brief §3.2, §4). */
export function BrandEmptyState({ title, body, action, tone = 'empty' }: BrandEmptyStateProps) {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.lg }}>
      <BrandMark size={96} opacity={t.isDark ? 0.16 : 0.12} style={{ marginBottom: spacing.md }} />
      <Text
        style={[t.type.title, tone === 'error' && { color: t.colors.danger }, { textAlign: 'center' }]}
      >
        {title}
      </Text>
      {body ? (
        <Text style={[t.type.body, { color: t.colors.textSecondary, textAlign: 'center', marginTop: spacing.xs }]}>
          {body}
        </Text>
      ) : null}
      {action ? (
        <View style={{ marginTop: spacing.md }}>
          <Button label={action.label} onPress={action.onPress} />
        </View>
      ) : null}
    </View>
  );
}
