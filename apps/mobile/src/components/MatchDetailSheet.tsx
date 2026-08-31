import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { TravelStyleVector } from '@amiva/core';
import { radius, spacing, useTheme } from '../theme';
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
 * always-on numeric breakdown. */
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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: t.colors.overlay }} onPress={onClose} />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: '88%',
          backgroundColor: t.colors.background,
          borderTopLeftRadius: radius.sheet,
          borderTopRightRadius: radius.sheet,
          padding: spacing.screen,
          gap: spacing.md,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={t.type.title}>{title}</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={12}>
            <Text style={[t.type.subtitle, { color: t.colors.textSecondary }]}>Close</Text>
          </Pressable>
        </View>

        <Text style={[t.type.statNumber, { alignSelf: 'center' }]}>{matchPercent}% match</Text>

        <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.lg }}>
          <View style={{ alignItems: 'center' }}>
            <TravelStyleRadar
              size={260}
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
