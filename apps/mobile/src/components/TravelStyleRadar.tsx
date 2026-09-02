/**
 * The Travel Style Radar (brief §2) — the one chart shown anywhere a
 * travel style appears (onboarding, profile, post detail, every
 * compatibility view). Nothing else in the app draws a radar.
 *
 * - Axes in a fixed clock order (RADAR_AXIS_ORDER) so a user's "shape"
 *   is comparable across every screen.
 * - Each axis is marked with its category *icon* (was a text label), the
 *   value dot + tip dot tinted that category's colour.
 * - Primary polygon fill is **two overlaid diagonal gradients** — purple
 *   (bottom-left) → yellow (top-right) on one, turquoise (bottom-right) →
 *   pink (top-left) on the other — each fading to near-transparent through
 *   the middle so every corner picks up the hue of the category icon that
 *   sits near it. Endpoints are real category hues, not literals. Drawn as
 *   two stacked <Polygon>s (or <AnimatedPolygon>s while morphing).
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
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Polygon, Stop } from 'react-native-svg';
import { CATEGORY_MAX, CategoryId, TravelStyleVector, topCategories } from '@amiva/core';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { CATEGORY_LABELS, RADAR_AXIS_ORDER, spacing, useTheme } from '../theme';
import { categoryGlyph } from './icons/CategoryIcon';

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
  /** Morph the primary polygon between vector changes. Leave off for static
   * comparison views (friend compat, match sheet) — a fixed `<Polygon>` is
   * used there, sidestepping the animation worklet entirely. */
  animate?: boolean;
}

const RINGS = 5;
const MORPH_MS = 280;
const N = RADAR_AXIS_ORDER.length;

function toDisplay(v: TravelStyleVector): number[] {
  return RADAR_AXIS_ORDER.map((c) => Math.max(0, Math.min(CATEGORY_MAX, v[c])));
}

/** `[v0,v1,…] → "x0,y0 x1,y1 …"` for a radar polygon at the given geometry. */
function pointsFor(values: number[], center: number, maxRadius: number, cos: number[], sin: number[]): string {
  return values
    .map((val, i) => {
      const r = (val / CATEGORY_MAX) * maxRadius;
      return `${center + r * (cos[i] ?? 0)},${center + r * (sin[i] ?? 0)}`;
    })
    .join(' ');
}

export function TravelStyleRadar({
  series,
  size = 240,
  showLabels = true,
  highlightTop = false,
  animate = true,
}: TravelStyleRadarProps) {
  const t = useTheme();
  const reduced = useReducedMotion();

  const center = size / 2;
  // Icons sit just outside the outer ring; less margin than the old text
  // labels needed.
  const maxRadius = center - (showLabels ? 24 : 10);
  const glyphSize = 16;

  const axes = useMemo(
    () =>
      Array.from({ length: N }, (_, i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / N;
        return { cos: Math.cos(a), sin: Math.sin(a) };
      }),
    [],
  );
  const cosArr = useMemo(() => axes.map((p) => p.cos), [axes]);
  const sinArr = useMemo(() => axes.map((p) => p.sin), [axes]);

  // Fill gradient — two overlaid diagonal gradients so all four "corners"
  // of the ring pick up their category hue: purple (bottom-left) → yellow
  // (top-right) on one diagonal, turquoise (bottom-right) → pink (top-left)
  // on the other. Each fades to near-transparent through the middle so a
  // layer only really contributes at its own two corners. Endpoints are
  // real category hues (roughly where those icons sit), not literals.
  const cornerBL = t.category('places_of_worship'); // purple
  const cornerTR = t.category('entertainment_and_recreation'); // yellow
  const cornerBR = t.category('lodging'); // turquoise
  const cornerTL = t.category('sports'); // pink

  const primary = series.find((s) => (s.kind ?? 'primary') === 'primary') ?? series[0];
  const compare = series.find((s) => s.kind === 'compare');

  const primaryValues = primary ? toDisplay(primary.vector) : new Array<number>(N).fill(0);
  const morphing = animate && !reduced;

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
    highlightTop && primary ? new Set(topCategories(primary.vector)) : new Set<CategoryId>();

  const a11y = primary
    ? RADAR_AXIS_ORDER.map(
        (c) => `${CATEGORY_LABELS[c]} ${primary.vector[c].toFixed(1)} of ${CATEGORY_MAX}`,
      ).join(', ')
    : undefined;

  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityLabel={a11y ? `Travel style: ${a11y}` : 'Travel style radar'}
    >
      <Svg width={size} height={size}>
        <Defs>
          {/* bottom-left → top-right : purple → yellow */}
          <LinearGradient id="radarFillA" x1="0" y1="1" x2="1" y2="0">
            <Stop offset={0} stopColor={cornerBL} stopOpacity={1} />
            <Stop offset={0.5} stopColor={cornerBL} stopOpacity={0.5} />
            <Stop offset={1} stopColor={cornerTR} stopOpacity={1} />
          </LinearGradient>
          {/* bottom-right → top-left : turquoise → pink */}
          <LinearGradient id="radarFillB" x1="1" y1="1" x2="0" y2="0">
            <Stop offset={0} stopColor={cornerBR} stopOpacity={1} />
            <Stop offset={0.5} stopColor={cornerBR} stopOpacity={0.5} />
            <Stop offset={1} stopColor={cornerTL} stopOpacity={1} />
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

        {morphing ? (
          <MorphingPolygon
            values={primaryValues}
            center={center}
            maxRadius={maxRadius}
            cos={cosArr}
            sin={sinArr}
            stroke={t.colors.accent}
          />
        ) : (
          (() => {
            const pts = pointsFor(primaryValues, center, maxRadius, cosArr, sinArr);
            return (
              <>
                <Polygon points={pts} fill="url(#radarFillA)" />
                <Polygon
                  points={pts}
                  fill="url(#radarFillB)"
                  stroke={t.colors.accent}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                />
              </>
            );
          })()
        )}

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
            const lr = maxRadius + 14;
            const s = top3.has(c) ? glyphSize + 3 : glyphSize;
            const gx = center + lr * p.cos - s / 2;
            const gy = center + lr * p.sin - s / 2;
            const glyph = categoryGlyph(c);
            return (
              <G key={`lbl${i}`} transform={`translate(${gx}, ${gy}) scale(${s / 24})`}>
                <Path d={glyph.d} fill={t.categoryText(c)} />
                {glyph.circle ? <Circle cx={12} cy={12} r={5.2} fill={t.categoryText(c)} /> : null}
              </G>
            );
          })}
      </Svg>
    </View>
  );
}

/** The primary polygon when it should morph between vector changes (own
 * profile, travel-style editor). All geometry is read from the closure so
 * the worklet re-inits with the current `center`/`maxRadius`. */
function MorphingPolygon({
  values,
  center,
  maxRadius,
  cos,
  sin,
  stroke,
}: {
  values: number[];
  center: number;
  maxRadius: number;
  cos: number[];
  sin: number[];
  stroke: string;
}) {
  const from = useSharedValue<number[]>(values);
  const to = useSharedValue<number[]>(values);
  const progress = useSharedValue(1);
  const key = values.join(',');

  useEffect(() => {
    from.value = to.value;
    to.value = values;
    progress.value = 0;
    progress.value = withTiming(1, { duration: MORPH_MS, easing: Easing.out(Easing.cubic) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const animatedProps = useAnimatedProps(() => {
    'worklet';
    const pts: string[] = [];
    for (let i = 0; i < N; i++) {
      const f = from.value[i] ?? 0;
      const tv = to.value[i] ?? 0;
      const val = f + (tv - f) * progress.value;
      const r = (val / CATEGORY_MAX) * maxRadius;
      const x = center + r * (cos[i] ?? 0);
      const y = center + r * (sin[i] ?? 0);
      pts.push(x + ',' + y);
    }
    return { points: pts.join(' ') };
  });

  // Two layers sharing the morph — one per diagonal gradient (see <Defs>),
  // stroke on the top one.
  return (
    <>
      <AnimatedPolygon animatedProps={animatedProps} fill="url(#radarFillA)" />
      <AnimatedPolygon
        animatedProps={animatedProps}
        fill="url(#radarFillB)"
        stroke={stroke}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
    </>
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
