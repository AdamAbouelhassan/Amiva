/**
 * The one remote-image primitive. Wraps `expo-image` (real memory+disk
 * cache, so images don't re-download when a list remounts) and shows a
 * Facebook-style pulsing skeleton until the image is ready.
 *
 * Use this for every network image; local `require()` assets can stay on
 * plain RN `<Image>`.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Image, ImageContentFit } from 'expo-image';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTheme } from '../theme';

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
  const t = useTheme();
  const reduceMotion = useReducedMotion();
  const [loaded, setLoaded] = useState(false);
  const pulse = useRef(new Animated.Value(0.5)).current;

  const showSkeleton = !uri || !loaded;
  const radius = borderRadiusFrom(style);

  useEffect(() => {
    setLoaded(false);
  }, [uri]);

  useEffect(() => {
    if (!showSkeleton || reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [showSkeleton, reduceMotion, pulse]);

  const skeletonStyle = useMemo(
    () => ({
      backgroundColor: t.colors.surfaceAlt,
      ...(radius !== undefined ? { borderRadius: radius } : {}),
    }),
    [t.colors.surfaceAlt, radius],
  );

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

      {showSkeleton ? (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            skeletonStyle,
            reduceMotion || !uri ? { opacity: 1 } : { opacity: pulse },
          ]}
        />
      ) : null}
    </View>
  );
}
