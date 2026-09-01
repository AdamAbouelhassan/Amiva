import { useContext } from 'react';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';

/** Bottom padding a scroll list needs so its last item clears the
 * floating (position: 'absolute') glass tab bar. Returns 0 outside a
 * bottom-tab navigator (modals, auth screens). */
export function useTabBarInset(): number {
  return useContext(BottomTabBarHeightContext) ?? 0;
}
