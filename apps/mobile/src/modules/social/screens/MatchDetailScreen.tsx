/**
 * The <MatchScoreBadge> tap target — the viewer's travel style overlaid on
 * the other party's, so the *difference* in shape is the story, plus the
 * numeric breakdown. A `presentation: 'modal'` screen (registered in every
 * stack a badge can appear in) so it slides + swipes exactly like the
 * "Log experience" modal.
 */
import { Text, View } from 'react-native';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TravelStyleRadar, TravelStyleValueList } from '../../../components/TravelStyleRadar';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { MatchDetailParams } from '../../../navigation/types';
import { spacing, useTheme } from '../../../theme';

export function MatchDetailScreen({ route }: { route: { params: MatchDetailParams } }) {
  const t = useTheme();
  const { profile } = useCurrentUser();
  const { title, matchPercent, vector } = route.params;
  const mine = profile?.travelStyle;

  return (
    <ScreenContainer>
      <Text style={[t.type.statNumber, { alignSelf: 'center' }]}>{matchPercent}% match</Text>

      <View style={{ alignItems: 'center' }}>
        <TravelStyleRadar
          size={260}
          animate={false}
          series={[
            ...(mine ? [{ vector: mine, kind: 'primary' as const }] : []),
            { vector, kind: 'compare' as const },
          ]}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.lg, alignSelf: 'center' }}>
        <Legend color={t.colors.accent} label="You" />
        <Legend color={t.colors.radarCompare} label={title} dashed />
      </View>

      <TravelStyleValueList vector={vector} />
    </ScreenContainer>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xxs }}>
      <View
        style={{
          width: 14,
          height: 0,
          borderBottomWidth: 3,
          borderColor: color,
          borderStyle: dashed ? 'dashed' : 'solid',
        }}
      />
      <Text style={t.type.bodySmall} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
