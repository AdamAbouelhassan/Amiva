import { memo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { BrandEmptyState } from '../../../components/BrandEmptyState';
import { CategoryIconFilter } from '../../../components/CategoryIconFilter';
import { FadeIn } from '../../../components/FadeIn';
import { LocationSearchField } from '../../../components/LocationSearchField';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { Skeleton } from '../../../components/Skeleton';
import { TextField } from '../../../components/TextField';
import { useRefresh } from '../../../hooks/useRefresh';
import { useTabBarInset } from '../../../hooks/useTabBarInset';
import { CATEGORY_LABELS, radius, spacing, useTheme } from '../../../theme';
import { PlaceRecommendationCard } from '../components/PlaceRecommendationCard';
import { LocalSection, PlaceRecommendationResult, useRecommendations } from '../hooks/useRecommendations';

const TILE_W = 264;
const SNAP_MS = 190;

const renderTile = ({ item }: { item: PlaceRecommendationResult }) => (
  <PlaceRecommendationCard place={item} width={TILE_W} />
);

/** One category / search-results row. Memoised so re-rendering the screen
 * (typing a keyword, the collapsing header) doesn't re-render the card lists. */
const SectionRow = memo(function SectionRow({ section, title }: { section: LocalSection; title: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={[t.type.title, { paddingHorizontal: spacing.screen }]}>{title}</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={section.items}
        keyExtractor={(p) => p.placeId}
        contentContainerStyle={{ paddingHorizontal: spacing.screen, gap: spacing.sm }}
        snapToInterval={TILE_W + spacing.sm}
        decelerationRate="fast"
        renderItem={renderTile}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
      />
    </View>
  );
});

/** The "results are loading" placeholder — mimics the real section layout
 * with the app's pulsing `Skeleton`. */
function SkeletonSections() {
  return (
    <View style={{ gap: spacing.lg }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ gap: spacing.xs }}>
          <Skeleton style={{ width: 150, height: 20, marginHorizontal: spacing.screen }} />
          <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.screen }}>
            <Skeleton style={{ width: TILE_W, height: 208, borderRadius: radius.card }} />
            <Skeleton style={{ width: TILE_W, height: 208, borderRadius: radius.card }} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function RecommendationsScreen() {
  const t = useTheme();
  const rec = useRecommendations();
  const refresh = useRefresh();
  const tabInset = useTabBarInset();

  // Quick-return filter bar: follows the finger while dragging (clamped to
  // its own height), then snaps fully open or fully closed on release. It's
  // clipped by the wrapper's `overflow:'hidden'` so it can't bleed over the
  // tabs above.
  const [headerH, setHeaderH] = useState(190);
  const hidden = useSharedValue(0); // px of the header currently scrolled off (0…headerH)
  const lastY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler(
    {
      onScroll: (e) => {
        const y = Math.max(0, e.contentOffset.y);
        const dy = y - lastY.value;
        lastY.value = y;
        if (y <= 0) {
          hidden.value = 0;
          return;
        }
        hidden.value = Math.min(headerH, Math.max(0, hidden.value + dy));
      },
      onEndDrag: (e) => {
        if (e.contentOffset.y <= headerH * 0.5) hidden.value = withTiming(0, { duration: SNAP_MS });
        else hidden.value = withTiming(hidden.value > headerH / 2 ? headerH : 0, { duration: SNAP_MS });
      },
      onMomentumEnd: (e) => {
        if (e.contentOffset.y <= headerH * 0.5) hidden.value = withTiming(0, { duration: SNAP_MS });
        else hidden.value = withTiming(hidden.value > headerH / 2 ? headerH : 0, { duration: SNAP_MS });
      },
    },
    [headerH],
  );

  const headerStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -hidden.value }] }));

  const sectionTitle = (s: LocalSection) =>
    s.category ? CATEGORY_LABELS[s.category] : `Results for “${rec.text.trim()}”`;

  const topPad = headerH + spacing.sm;
  // A filter change clears the list to a skeleton; a background refresh with
  // results already on screen keeps the list.
  const showSkeleton = rec.loading && rec.sections.length === 0;

  return (
    <ScreenContainer scroll={false}>
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <Animated.View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            setHeaderH((prev) => (Math.abs(prev - h) > 1 ? h : prev));
          }}
          style={[
            styles.header,
            { backgroundColor: t.colors.background, borderBottomColor: t.colors.border },
            headerStyle,
          ]}
        >
          <LocationSearchField value={rec.location} onChange={rec.setLocation} loading={rec.locationLoading} />
          <TextField
            value={rec.text}
            onChangeText={rec.setText}
            placeholder="Keyword — e.g. street food, live music"
            returnKeyType="search"
          />
          <CategoryIconFilter value={rec.category} onChange={rec.setCategory} />
          {rec.error ? <Text style={[t.type.bodySmall, { color: t.colors.danger }]}>{rec.error}</Text> : null}
        </Animated.View>

        {showSkeleton ? (
          <FadeIn key="skeleton" style={{ flex: 1, paddingTop: topPad }}>
            <SkeletonSections />
          </FadeIn>
        ) : (
          <FadeIn key="list" style={{ flex: 1 }}>
            <Animated.FlatList
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingTop: topPad,
                paddingBottom: spacing.screen + tabInset,
                gap: spacing.lg,
              }}
              onScroll={onScroll}
              scrollEventThrottle={16}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              initialNumToRender={2}
              maxToRenderPerBatch={2}
              windowSize={5}
              refreshControl={
                <RefreshControl
                  refreshing={refresh.refreshing}
                  onRefresh={refresh.onRefresh}
                  tintColor={t.colors.accent}
                  colors={[t.colors.accent]}
                  progressViewOffset={headerH}
                />
              }
              data={rec.sections}
              keyExtractor={(s: LocalSection) => s.key}
              ListEmptyComponent={
                !rec.loading && !rec.error ? (
                  <BrandEmptyState
                    title={rec.hasSearched ? 'No places found' : 'Where to?'}
                    body={
                      rec.hasSearched
                        ? 'Try a broader location, a different keyword, or clear the category.'
                        : 'Set a location above — we’ll pull places that fit your travel style, by category.'
                    }
                  />
                ) : null
              }
              renderItem={({ item: section }: { item: LocalSection }) => (
                <SectionRow section={section} title={sectionTitle(section)} />
              )}
            />
          </FadeIn>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
