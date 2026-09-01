import { Modal, ScrollView, Text, View } from 'react-native';
import { TravelStyleVector } from '@amiva/core';
import { spacing, useTheme } from '../theme';
import { TravelStyleRadar, TravelStyleValueList } from './TravelStyleRadar';

interface MatchDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** The viewer's vector. */
  vectorA: TravelStyleVector;
  /** The other party / the post's vector — drawn as the compare outline. */
  vectorB: TravelStyleVector;
  matchPercent: number;
}

/** Opened by every <MatchScoreBadge> tap (brief §2, §3.4): the two travel
 * styles overlaid so the *difference* in shape is the story, plus the
 * numeric breakdown. A native `pageSheet` — swipe it down to dismiss, same
 * as the "Log experience" modal (no close button). */
export function MatchDetailSheet({
  visible,
  onClose,
  title,
  vectorA,
  vectorB,
  matchPercent,
}: MatchDetailSheetProps) {
  const t = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onDismiss={onClose}
    >
      <View style={{ flex: 1, backgroundColor: t.colors.background }}>
        <View style={{ alignItems: 'center', paddingTop: spacing.sm }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: t.colors.borderStrong }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.screen, gap: spacing.md }}>
          <Text style={t.type.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={[t.type.statNumber, { alignSelf: 'center' }]}>{matchPercent}% match</Text>

          <View style={{ alignItems: 'center' }}>
            <TravelStyleRadar
              size={240}
              animate={false}
              series={[
                { vector: vectorA, kind: 'primary' },
                { vector: vectorB, kind: 'compare' },
              ]}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.lg, alignSelf: 'center' }}>
            <Legend color={t.colors.accent} label="You" />
            <Legend color={t.colors.radarCompare} label={title} dashed />
          </View>

          <TravelStyleValueList vector={vectorB} />
        </ScrollView>
      </View>
    </Modal>
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
