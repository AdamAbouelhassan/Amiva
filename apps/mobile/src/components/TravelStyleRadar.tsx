/**
 * The Travel Style Radar (brief §2) — the one chart shown anywhere a
 * travel style appears (onboarding, profile, post detail, every
 * compatibility view). Nothing else in the app draws a radar.
 *
 * - 8 axes in a fixed clock order (RADAR_AXIS_ORDER) so a user's "shape"
 *   is comparable across every screen.
 * - Axis labels + outer intersection dots tinted per category colour.
 * - Primary polygon filled with a gradient of the 4 core brand hues
 *   (the overlapping-lens echo), not a flat accent.
 * - Two-vector mode: the compare vector is a dashed outline in ink with a
 *   faint fill so the *difference* between the shapes is the story.
 * - Top-3 categories get a larger filled dot.
 * - The polygon morphs (not cuts) when the vector changes; respects
 *   reduce-motion.
 * - Numeric values always available via the a11y label + <TravelStyleValueList>.
 */
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Polygon, Stop, Text as SvgText } from 'react-native-svg';
import { CATEGORY_MAX, TravelStyleCategory, TravelStyleVector, topCategories } from '@amiva/core';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { CATEGORY_LABELS, RADAR_AXIS_ORDER, spacing, useTheme } from '../theme';

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

export interface RadarSeries {
  vector: TravelStyleVector;
  kind?: 'primary' | 'compare';
}

interface TravelStyleRadarProps {
  series: RadarSeries[];
  size?: number;
  showLabels?: boolean;
  highlightTop?: boolean;
}

const RINGS = 4;
const MORPH_MS = 280;
const N = RADAR_AXIS_ORDER.length;

function toDisplay(v: TravelStyleVector): number[] {
  return RADAR_AXIS_ORDER.map((c) => Math.max(0, Math.min(CATEGORY_MAX, v[c])));
}

export function TravelStyleRadar({
  series,
  size = 240,
  showLabels = true,
  highlightTop = false,
}: TravelStyleRadarProps) {
  const t = useTheme();
  const reduced = useReducedMotion();

  const center = size / 2;
  const maxRadius = center - (showLabels ? 40 : 10);

  const axes = useMemo(
    () =>
      Array.from({ length: N }, (_, i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / N;
        return { cos: Math.cos(a), sin: Math.sin(a) };
      }),
    [],
  );

  const primary = series.find((s) => (s.kind ?? 'primary') === 'primary') ?? series[0];
  const compare = series.find((s) => s.kind === 'compare');

  const primaryValues = primary ? toDisplay(primary.vector) : new Array(N).fill(0);
  const primaryKey = primaryValues.join(',');

  const from = useSharedValue<number[]>(primaryValues);
  const to = useSharedValue<number[]>(primaryValues);
  const progress = useSharedValue(1);
  const cosSv = useSharedValue(axes.map((p) => p.cos));
  const sinSv = useSharedValue(axes.map((p) => p.sin));
  const geomSv = useSharedValue({ center, maxRadius });

  useEffect(() => {
    cosSv.value = axes.map((p) => p.cos);
    sinSv.value = axes.map((p) => p.sin);
    geomSv.value = { center, maxRadius };
  }, [axes, center, maxRadius, cosSv, sinSv, geomSv]);

  useEffect(() => {
    from.value = to.value;
    to.value = primaryValues;
    if (reduced) {
      progress.value = 1;
    } else {
      progress.value = 0;
      progress.value = withTiming(1, { duration: MORPH_MS, easing: Easing.out(Easing.cubic) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryKey, reduced]);

  const animatedProps = useAnimatedProps(() => {
    'worklet';
    const cx = geomSv.value.center;
    const mr = geomSv.value.maxRadius;
    const pts: string[] = [];
    for (let i = 0; i < N; i++) {
      const f = from.value[i] ?? 0;
      const tv = to.value[i] ?? 0;
      const val = f + (tv - f) * progress.value;
      const r = (val / CATEGORY_MAX) * mr;
      const x = cx + r * (cosSv.value[i] ?? 0);
      const y = cx + r * (sinSv.value[i] ?? 0);
      pts.push(x + ',' + y);
    }
    return { points: pts.join(' ') };
  });

  const rings = useMemo(
    () =>
      Array.from({ length: RINGS }, (_, ri) => {
        const rr = (maxRadius * (ri + 1)) / RINGS;
        return axes.map((p) => `${center + rr * p.cos},${center + rr * p.sin}`).join(' ');
      }),
    [maxRadius, center, axes],
  );

  const comparePts = compare
    ? toDisplay(compare.vector)
        .map((val, i) => {
          const r = (val / CATEGORY_MAX) * maxRadius;
          const p = axes[i]!;
          return `${center + r * p.cos},${center + r * p.sin}`;
        })
        .join(' ')
    : null;

  const top3 =
    highlightTop && primary ? new Set(topCategories(primary.vector)) : new Set<TravelStyleCategory>();

  const a11y = primary
    ? RADAR_AXIS_ORDER.map((c) => `${CATEGORY_LABELS[c]} ${primary.vector[c].toFixed(0)} of 10`).join(', ')
    : undefined;

  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityLabel={a11y ? `Travel style: ${a11y}` : 'Travel style radar'}
    >
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={t.colors.radarGradient[0]} stopOpacity={0.55} />
            <Stop offset="0.4" stopColor={t.colors.radarGradient[1]} stopOpacity={0.4} />
            <Stop offset="0.7" stopColor={t.colors.radarGradient[2]} stopOpacity={0.4} />
            <Stop offset="1" stopColor={t.colors.radarGradient[3]} stopOpacity={0.5} />
          </LinearGradient>
        </Defs>

        {rings.map((pts, i) => (
          <Polygon key={`ring${i}`} points={pts} fill="none" stroke={t.colors.radarGrid} strokeWidth={1} />
        ))}
        {axes.map((p, i) => (
          <Line
            key={`axis${i}`}
            x1={center}
            y1={center}
            x2={center + maxRadius * p.cos}
            y2={center + maxRadius * p.sin}
            stroke={t.colors.radarGrid}
            strokeWidth={1}
          />
        ))}
        {RADAR_AXIS_ORDER.map((c, i) => {
          const p = axes[i]!;
          return (
            <Circle
              key={`tip${i}`}
              cx={center + maxRadius * p.cos}
              cy={center + maxRadius * p.sin}
              r={2.5}
              fill={t.category(c)}
            />
          );
        })}

        {comparePts && (
          <Polygon
            points={comparePts}
            fill={t.colors.radarCompare}
            fillOpacity={0.12}
            stroke={t.colors.radarCompare}
            strokeWidth={2}
            strokeDasharray="4 3"
          />
        )}

        <AnimatedPolygon
          animatedProps={animatedProps}
          fill="url(#radarFill)"
          stroke={t.colors.accent}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />

        {primary &&
          RADAR_AXIS_ORDER.map((c, i) => {
            const val = primaryValues[i] ?? 0;
            const r = (val / CATEGORY_MAX) * maxRadius;
            const p = axes[i]!;
            const isTop = top3.has(c);
            return (
              <Circle
                key={`dot${i}`}
                cx={center + r * p.cos}
                cy={center + r * p.sin}
                r={isTop ? 5 : 3}
                fill={t.category(c)}
                stroke={isTop ? t.colors.surface : undefined}
                strokeWidth={isTop ? 1.5 : 0}
              />
            );
          })}

        {showLabels &&
          RADAR_AXIS_ORDER.map((c, i) => {
            const p = axes[i]!;
            const lr = maxRadius + 18;
            return (
              <SvgText
                key={`lbl${i}`}
                x={center + lr * p.cos}
                y={center + lr * p.sin}
                fontSize={9}
                fontWeight={top3.has(c) ? '700' : '500'}
                fill={t.categoryText(c)}
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {CATEGORY_LABELS[c]}
              </SvgText>
            );
          })}
      </Svg>
    </View>
  );
}

/** Numeric breakdown — spec §2.6: category values always visible, not just the shape. */
export function TravelStyleValueList({ vector }: { vector: TravelStyleVector }) {
  const t = useTheme();
  return (
    <View style={{ gap: spacing.xxs }}>
      {RADAR_AXIS_ORDER.map((c) => (
        <View key={c} style={styles.valueRow}>
          <Text style={t.type.body}>{CATEGORY_LABELS[c]}</Text>
          <Text style={[t.type.subtitle, { color: t.categoryText(c) }]}>{vector[c].toFixed(1)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  valueRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xxs },
});
