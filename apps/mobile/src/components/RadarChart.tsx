/**
 * The one shared radar/spider chart component (CLAUDE.md Style Guide,
 * functional_specification.md §2.2) — used identically for a user's own
 * profile, an experience's category profile, a friend-compatibility
 * detail view (two overlaid series), and a group trip view. Nothing else
 * in the app should draw its own radar chart.
 *
 * Presentational only — no data fetching (CLAUDE.md: "/components —
 * shared/presentational components only").
 */
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { CATEGORY_MAX, TRAVEL_STYLE_CATEGORIES, TravelStyleVector } from '@amiva/core';
import { CATEGORY_LABELS, colors, spacing, typography } from '../theme';

export interface RadarChartSeries {
  vector: TravelStyleVector;
  color: string;
  /** Fill opacity for this series' polygon — lower when overlaying two
   * series so both remain readable. */
  fillOpacity?: number;
}

interface RadarChartProps {
  series: RadarChartSeries[];
  size?: number;
  showAxisLabels?: boolean;
}

const RING_COUNT = 4;

function pointOnAxis(index: number, total: number, radius: number, center: number) {
  // First axis points straight up; axes go clockwise from there.
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
  return {
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle),
  };
}

export function RadarChart({ series, size = 240, showAxisLabels = true }: RadarChartProps) {
  const center = size / 2;
  const labelPadding = showAxisLabels ? 36 : 8;
  const maxRadius = center - labelPadding;
  const categoryCount = TRAVEL_STYLE_CATEGORIES.length;

  const rings = useMemo(
    () =>
      Array.from({ length: RING_COUNT }, (_, ringIndex) => {
        const ringRadius = (maxRadius * (ringIndex + 1)) / RING_COUNT;
        const points = TRAVEL_STYLE_CATEGORIES.map((_, i) =>
          pointOnAxis(i, categoryCount, ringRadius, center),
        );
        return points.map((p) => `${p.x},${p.y}`).join(' ');
      }),
    [maxRadius, center, categoryCount],
  );

  const axisEndpoints = useMemo(
    () => TRAVEL_STYLE_CATEGORIES.map((_, i) => pointOnAxis(i, categoryCount, maxRadius, center)),
    [maxRadius, center, categoryCount],
  );

  const seriesPolygons = useMemo(
    () =>
      series.map((s) => {
        const points = TRAVEL_STYLE_CATEGORIES.map((category, i) => {
          const value = Math.max(0, Math.min(CATEGORY_MAX, s.vector[category]));
          const radius = (value / CATEGORY_MAX) * maxRadius;
          return pointOnAxis(i, categoryCount, radius, center);
        });
        return { ...s, pointsAttr: points.map((p) => `${p.x},${p.y}`).join(' ') };
      }),
    [series, maxRadius, center, categoryCount],
  );

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {rings.map((points, i) => (
          <Polygon key={`ring-${i}`} points={points} fill="none" stroke={colors.border} strokeWidth={1} />
        ))}

        {axisEndpoints.map((p, i) => (
          <Line key={`axis-${i}`} x1={center} y1={center} x2={p.x} y2={p.y} stroke={colors.border} strokeWidth={1} />
        ))}

        {seriesPolygons.map((s, i) => (
          <Polygon
            key={`series-${i}`}
            points={s.pointsAttr}
            fill={s.color}
            fillOpacity={s.fillOpacity ?? 0.25}
            stroke={s.color}
            strokeWidth={2}
          />
        ))}

        {seriesPolygons.map((s, i) =>
          TRAVEL_STYLE_CATEGORIES.map((category, catIndex) => {
            const value = Math.max(0, Math.min(CATEGORY_MAX, s.vector[category]));
            const radius = (value / CATEGORY_MAX) * maxRadius;
            const p = pointOnAxis(catIndex, categoryCount, radius, center);
            return <Circle key={`dot-${i}-${catIndex}`} cx={p.x} cy={p.y} r={3} fill={s.color} />;
          }),
        )}

        {showAxisLabels &&
          TRAVEL_STYLE_CATEGORIES.map((category, i) => {
            const p = pointOnAxis(i, categoryCount, maxRadius + 18, center);
            return (
              <SvgText
                key={`label-${i}`}
                x={p.x}
                y={p.y}
                fontSize={10}
                fill={colors.textSecondary}
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {CATEGORY_LABELS[category]}
              </SvgText>
            );
          })}
      </Svg>
    </View>
  );
}

/** Numeric breakdown alongside the chart — functional_specification.md
 * §2.6: "Numeric category values are always visible (not just the visual
 * shape) when a user views their own matrix or a match detail view." */
export function TravelStyleValueList({ vector }: { vector: TravelStyleVector }) {
  return (
    <View style={styles.valueList}>
      {TRAVEL_STYLE_CATEGORIES.map((category) => (
        <View key={category} style={styles.valueRow}>
          <Text style={typography.body}>{CATEGORY_LABELS[category]}</Text>
          <Text style={[typography.body, styles.valueNumber]}>{vector[category].toFixed(1)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueList: {
    marginTop: spacing.md,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xxs,
  },
  valueNumber: {
    fontWeight: '600',
    color: colors.accent,
  },
});
