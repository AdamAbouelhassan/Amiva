import { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTheme } from '../theme';

/** A checklist checkbox with a small spring pop on check — the itinerary
 * tick is one of the few purely-satisfying taps in the app (brief §3.3). */
export function AnimatedCheck({ checked, size = 22 }: { checked: boolean; size?: number }) {
  const t = useTheme();
  const reduced = useReducedMotion();
  const scale = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      scale.value = checked ? 1 : 0;
    } else {
      scale.value = checked ? withSpring(1, { damping: 9, stiffness: 220 }) : withTiming(0, { duration: 120 });
    }
  }, [checked, reduced, scale]);

  const markStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: scale.value }));

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: checked ? t.colors.accent : t.colors.borderStrong,
        backgroundColor: checked ? t.colors.accent : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Animated.View style={markStyle}>
        <Text style={{ color: t.colors.textOnAccent, fontSize: size * 0.6, fontWeight: '900' }}>✓</Text>
      </Animated.View>
    </Animated.View>
  );
}
