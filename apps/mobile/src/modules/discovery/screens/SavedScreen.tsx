/**
 * Everything the user has saved — logged Amiva experiences (`saves`) and
 * raw Google Places from the Local tab (`savedPlaces`), in one merged
 * newest-first list. Save is the only engagement action
 * (functional_specification.md §5.1); this is where you review it, remove
 * it, or turn it into a logged experience.
 */
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { AppImage } from '../../../components/AppImage';
import { BrandEmptyState } from '../../../components/BrandEmptyState';
import { IconButton } from '../../../components/IconButton';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { useLogExperienceNav } from '../../../hooks/useLogExperienceNav';
import { useRefresh } from '../../../hooks/useRefresh';
import { useTabBarInset } from '../../../hooks/useTabBarInset';
import { SavedItem, useSavedItems, useUnsaveExperience, useUnsavePlace } from '../../../hooks/useSaves';
import { openInGoogleMaps } from '../../../lib/mapsUrl';
import { placePhotoUrl } from '../../../lib/placePhoto';
import { DiscoveryStackParamList } from '../../../navigation/types';
import { radius, spacing, useTheme } from '../../../theme';

interface SavedScreenProps {
  navigation: {
    navigate: <T extends keyof DiscoveryStackParamList>(screen: T, params?: DiscoveryStackParamList[T]) => void;
  };
}

export function SavedScreen({ navigation }: SavedScreenProps) {
  const t = useTheme();
  const refresh = useRefresh();
  const tabInset = useTabBarInset();
  const { items, isLoading } = useSavedItems();
  const unsaveExperience = useUnsaveExperience();
  const unsavePlace = useUnsavePlace();
  const logNav = useLogExperienceNav();

  return (
    <ScreenContainer scroll={false}>
      <View style={{ padding: spacing.screen, paddingBottom: spacing.xs }}>
        <Text style={t.type.displayMd}>Saved</Text>
        <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]}>
          Experiences and places you've kept — log your own visit, or use them to plan a trip.
        </Text>
      </View>

      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.lg + tabInset, gap: spacing.sm }}
        data={items}
        keyExtractor={(item) => `${item.kind}:${item.id}`}
        refreshControl={
          <RefreshControl
            refreshing={refresh.refreshing}
            onRefresh={refresh.onRefresh}
            tintColor={t.colors.accent}
            colors={[t.colors.accent]}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <BrandEmptyState
              title="Nothing saved yet"
              body="Tap Save on any experience or place in Discovery to keep it here."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <SavedRow
            item={item}
            busy={logNav.preparing}
            onOpen={
              item.kind === 'experience'
                ? () => navigation.navigate('ExperienceDetail', { experienceId: item.experience.experienceId })
                : () =>
                    openInGoogleMaps({
                      name: item.place.name,
                      city: item.place.city,
                      country: item.place.country,
                      placeId: item.place.placeId,
                      lat: item.place.lat,
                      lng: item.place.lng,
                    })
            }
            onLog={() =>
              item.kind === 'experience'
                ? logNav.fromExperience(item.experience)
                : logNav.fromPlace(item.place)
            }
            onRemove={() =>
              item.kind === 'experience'
                ? unsaveExperience.mutate(item.experience.experienceId)
                : unsavePlace.mutate(item.place.placeId)
            }
          />
        )}
      />
    </ScreenContainer>
  );
}

function SavedRow({
  item,
  busy,
  onOpen,
  onLog,
  onRemove,
}: {
  item: SavedItem;
  busy: boolean;
  onOpen?: () => void;
  onLog: () => void;
  onRemove: () => void;
}) {
  const t = useTheme();

  const title = item.kind === 'experience' ? item.experience.title : item.place.name;
  const subtitle =
    item.kind === 'experience'
      ? `${item.experience.city}, ${item.experience.country}`
      : `${item.place.city}, ${item.place.country}`;
  const photoUri =
    item.kind === 'experience'
      ? item.experience.photoUrls[0]
      : item.place.photoRef
        ? placePhotoUrl(item.place.photoRef)
        : undefined;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: t.colors.surface,
        borderWidth: 1,
        borderColor: t.colors.border,
        borderRadius: radius.card,
        padding: spacing.sm,
      }}
    >
      <Pressable
        onPress={onOpen}
        disabled={!onOpen}
        style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', flex: 1 }}
      >
        <AppImage uri={photoUri} style={{ width: 52, height: 52, borderRadius: radius.chip }} />
        <View style={{ flex: 1 }}>
          <Text style={t.type.subtitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </Pressable>

      <IconButton name="add-circle-outline" onPress={onLog} loading={busy} accessibilityLabel="Log this" size={32} />
      <IconButton name="trash-outline" tone="danger" onPress={onRemove} accessibilityLabel="Remove" size={32} />
    </View>
  );
}
