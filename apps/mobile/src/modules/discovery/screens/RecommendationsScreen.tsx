import { useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { BrandEmptyState } from '../../../components/BrandEmptyState';
import { CategoryIconFilter } from '../../../components/CategoryIconFilter';
import { LocationSearchField } from '../../../components/LocationSearchField';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TextField } from '../../../components/TextField';
import { useRefresh } from '../../../hooks/useRefresh';
import { useTabBarInset } from '../../../hooks/useTabBarInset';
import { CATEGORY_LABELS, spacing, useTheme } from '../../../theme';
import { PlaceRecommendationCard } from '../components/PlaceRecommendationCard';
import { LocalSection, useRecommendations } from '../hooks/useRecommendations';

const TILE_W = 264;

export function RecommendationsScreen() {
  const t = useTheme();
  const rec = useRecommendations();
  const refresh = useRefresh();
  const tabInset = useTabBarInset();

  // Collapsing filter bar (1:1 with scroll, reappears on any upward drag).
  const [headerH, setHeaderH] = useState(190);
  const lastY = useSharedValue(0);
  const clamped = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      const y = e.contentOffset.y;
      const dy = y - lastY.value;
      lastY.value = y;
      if (y <= 0) {
        clamped.value = 0;
        return;
      }
      clamped.value = Math.min(headerH, Math.max(0, clamped.value + dy));
    },
  });

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -clamped.value }],
    opacity: headerH > 0 ? 1 - clamped.value / headerH : 1,
  }));

  const sectionTitle = (s: LocalSection) =>
    s.category ? CATEGORY_LABELS[s.category] : `Results for “${rec.text.trim()}”`;

  return (
    <ScreenContainer scroll={false}>
      <Animated.View
        onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            backgroundColor: t.colors.background,
            paddingHorizontal: spacing.screen,
            paddingTop: spacing.sm,
            paddingBottom: spacing.xs,
            gap: spacing.xs,
            borderBottomWidth: 1,
            borderBottomColor: t.colors.border,
          },
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
        {rec.error && <Text style={[t.type.bodySmall, { color: t.colors.danger }]}>{rec.error}</Text>}
      </Animated.View>

      <Animated.FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: headerH + spacing.sm, paddingBottom: spacing.screen + tabInset, gap: spacing.lg }}
        onScroll={onScroll}
        refreshControl={
          <RefreshControl
            refreshing={refresh.refreshing}
            onRefresh={refresh.onRefresh}
            tintColor={t.colors.accent}
            colors={[t.colors.accent]}
            progressViewOffset={headerH}
          />
        }
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        data={rec.sections}
        keyExtractor={(s) => s.key}
        ListEmptyComponent={
          !rec.isLoading && !rec.error ? (
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
        renderItem={({ item: section }) => (
          <View style={{ gap: spacing.xs }}>
            <Text style={[t.type.title, { paddingHorizontal: spacing.screen }]}>{sectionTitle(section)}</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={section.items}
              keyExtractor={(p) => p.placeId}
              contentContainerStyle={{ paddingHorizontal: spacing.screen, gap: spacing.sm }}
              snapToInterval={TILE_W + spacing.sm}
              decelerationRate="fast"
              renderItem={({ item }) => <PlaceRecommendationCard place={item} width={TILE_W} />}
            />
          </View>
        )}
      />
    </ScreenContainer>
  );
}
