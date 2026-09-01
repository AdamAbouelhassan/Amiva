/**
 * The one remote-image primitive. Wraps `expo-image` (real memory+disk
 * cache, so images don't re-download when a list remounts) and shows a
 * pulsing `Skeleton` until the image is ready.
 *
 * Use this for every network image; local `require()` assets can stay on
 * plain RN `<Image>`.
 */
import { useEffect, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Image, ImageContentFit } from 'expo-image';
import { SkeletonFill } from './Skeleton';

interface AppImageProps {
  uri?: string | null;
  style?: StyleProp<ViewStyle>;
  contentFit?: ImageContentFit;
  accessibilityLabel?: string;
}

function borderRadiusFrom(style: StyleProp<ViewStyle>): number | undefined {
  const flat = StyleSheet.flatten(style) as ViewStyle | undefined;
  return typeof flat?.borderRadius === 'number' ? flat.borderRadius : undefined;
}

export function AppImage({ uri, style, contentFit = 'cover', accessibilityLabel }: AppImageProps) {
  const [loaded, setLoaded] = useState(false);
  const showSkeleton = !uri || !loaded;

  useEffect(() => {
    setLoaded(false);
  }, [uri]);

  return (
    <View style={[style, { overflow: 'hidden' }]}>
      {uri ? (
        <Image
          source={uri}
          style={StyleSheet.absoluteFill}
          contentFit={contentFit}
          cachePolicy="memory-disk"
          transition={220}
          recyclingKey={uri}
          onLoadEnd={() => setLoaded(true)}
          accessibilityLabel={accessibilityLabel}
        />
      ) : null}

      {showSkeleton ? <SkeletonFill borderRadius={borderRadiusFrom(style)} pulse={!!uri} /> : null}
    </View>
  );
}
