/**
 * The <MatchScoreBadge> tap target — the viewer's travel style overlaid on
 * the other party's, so the *difference* in shape is the story, plus the
 * numeric breakdown. A `presentation: 'modal'` screen (registered in every
 * stack a badge can appear in) so it slides + swipes exactly like the
 * "Log experience" modal.
 *
 * Fits on one screen — no scroll. The radar takes whatever vertical space
 * is left once the header, legend, and value list are placed, sized off the
 * measured gap so the animated polygon never redraws off-centre.
 */
import { useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
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
  const { width } = useWindowDimensions();
  const [radarBox, setRadarBox] = useState(0);

  const size = Math.max(140, Math.min(width - spacing.screen * 2, radarBox - spacing.md));

  return (
    <ScreenContainer scroll={false}>
      <View style={{ flex: 1, padding: spacing.screen, gap: spacing.md }}>
        <Text style={[t.type.statNumber, { alignSelf: 'center' }]}>{matchPercent}% match</Text>

        <View style={{ flexDirection: 'row', gap: spacing.lg, alignSelf: 'center' }}>
          <Legend color={t.colors.accent} label="You" />
          <Legend color={t.colors.radarCompare} label={title} dashed />
        </View>

        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          onLayout={(e) => setRadarBox(e.nativeEvent.layout.height)}
        >
          {radarBox > 0 ? (
            <TravelStyleRadar
              size={size}
              animate={false}
              series={[
                ...(mine ? [{ vector: mine, kind: 'primary' as const }] : []),
                { vector, kind: 'compare' as const },
              ]}
            />
          ) : null}
        </View>

        <TravelStyleValueList vector={vector} />
      </View>
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
