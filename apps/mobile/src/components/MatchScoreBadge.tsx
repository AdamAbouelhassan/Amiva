/**
 * The match-/compatibility-% pill (brief §3.4) — the most-repeated piece
 * of UI in the app, so it's one component used identically on feed posts,
 * recommendations, and friend compatibility.
 *
 * - Fill is a position on a warm→cool BRAND ramp keyed to the score, never
 *   a green/red traffic light (which fights the palette and flattens an
 *   8-dimensional similarity into "good/bad").
 * - The number counts up on mount / change (unless reduce-motion).
 * - Tapping it always opens the two-radar overlay, when the vectors are
 *   supplied.
 */
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TravelStyleVector } from '@amiva/core';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { MatchDetailParams } from '../navigation/types';
import { radius, spacing, useTheme } from '../theme';

interface MatchScoreBadgeProps {
  /** 0–100 (already converted via `toMatchPercent`). */
  matchPercent: number;
  size?: 'sm' | 'lg';
  /** Supply both to make the badge open the compatibility detail on tap.
   * `vectorA` is the viewer's — the detail screen reads it itself, this is
   * just the "is a comparison possible" gate. */
  vectorA?: TravelStyleVector;
  vectorB?: TravelStyleVector;
  detailTitle?: string;
  /** Override the default tap (skips the detail screen). */
  onPress?: () => void;
}

function mix(a: string, b: string, tRatio: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) => {
    const ca = (pa >> shift) & 0xff;
    const cb = (pb >> shift) & 0xff;
    return Math.round(ca + (cb - ca) * tRatio);
  };
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}

export function MatchScoreBadge({
  matchPercent,
  size = 'sm',
  vectorA,
  vectorB,
  detailTitle,
  onPress,
}: MatchScoreBadgeProps) {
  const t = useTheme();
  const reduced = useReducedMotion();
  const navigation = useNavigation<{
    navigate: (screen: 'MatchDetail', params: MatchDetailParams) => void;
  }>();
  const [display, setDisplay] = useState(reduced ? matchPercent : 0);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (reduced) {
      setDisplay(matchPercent);
      return;
    }
    const start = Date.now();
    const dur = 550;
    // Throttle the state writes to ~25/s — a screenful of these mounting
    // together (a filter change on the recs list) otherwise floods the JS
    // thread with re-renders and stutters.
    let lastWrite = 0;
    const tick = () => {
      const now = Date.now();
      const p = Math.min(1, (now - start) / dur);
      if (p >= 1 || now - lastWrite >= 40) {
        lastWrite = now;
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplay(Math.round(matchPercent * eased));
      }
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [matchPercent, reduced]);

  // warm (low) → cool (high) brand ramp — AA-safe for the label in both themes
  const ramp = t.colors.matchRamp;
  const seg = Math.min(0.999, Math.max(0, matchPercent / 100)) * 3;
  const i = Math.floor(seg) as 0 | 1 | 2 | 3;
  const fill = mix(ramp[i], ramp[Math.min(3, i + 1) as 0 | 1 | 2 | 3], seg - i);

  const big = size === 'lg';
  const canOpenDetail = !!(vectorA && vectorB);

  const body = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
        backgroundColor: fill,
        borderRadius: radius.pill,
        paddingHorizontal: big ? spacing.md : spacing.sm,
        paddingVertical: big ? spacing.xs : 4,
      }}
    >
      <Text
        style={{
          fontFamily: t.type.statNumber.fontFamily,
          fontSize: big ? 22 : 15,
          color: t.colors.textOnAccent,
        }}
      >
        {display}%
      </Text>
      <Text
        style={{
          fontFamily: t.type.caption.fontFamily,
          fontSize: big ? 12 : 10,
          color: t.colors.textOnAccent,
        }}
      >
        match
      </Text>
    </View>
  );

  const handlePress =
    onPress ??
    (canOpenDetail
      ? () =>
          navigation.navigate('MatchDetail', {
            title: detailTitle ?? 'Compatibility',
            matchPercent,
            vector: vectorB!,
          })
      : undefined);

  if (!handlePress) return body;

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${matchPercent}% match${canOpenDetail ? ', view compatibility detail' : ''}`}
    >
      {body}
    </Pressable>
  );
}
