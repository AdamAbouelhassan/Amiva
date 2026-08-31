import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import type { SelectedLocation } from '../components/LocationSearchField';

interface CurrentLocationState {
  location: SelectedLocation | null;
  loading: boolean;
  /** Permission denied, GPS off, or geocode failed — caller just falls
   * back to letting the user type a location. */
  unavailable: boolean;
}

/** Resolved once per app session and reused — the device isn't moving
 * between countries while the app is open, so re-pinging GPS on every
 * mount is wasted work (and a visible "finding your location…" flash). */
let sessionResult: CurrentLocationState | null = null;
let inFlight: Promise<CurrentLocationState> | null = null;

async function resolveOnce(): Promise<CurrentLocationState> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { location: null, loading: false, unavailable: true };

    const pos =
      (await Location.getLastKnownPositionAsync()) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
    const [place] = await Location.reverseGeocodeAsync(pos.coords);
    const country = place?.country ?? undefined;
    const city = place?.city ?? place?.subregion ?? place?.region ?? undefined;
    if (!country) return { location: null, loading: false, unavailable: true };

    const label = [city, country].filter(Boolean).join(', ');
    return {
      location: { label, country, city: city && city !== country ? city : undefined },
      loading: false,
      unavailable: false,
    };
  } catch {
    return { location: null, loading: false, unavailable: true };
  }
}

/**
 * Resolves the device's current location to a `{ label, country, city }`
 * — used to pre-fill the "For You" search (brief). Cached for the app
 * session; failures degrade silently to `unavailable: true`.
 */
export function useCurrentLocation(): CurrentLocationState {
  const [state, setState] = useState<CurrentLocationState>(
    () => sessionResult ?? { location: null, loading: true, unavailable: false },
  );

  useEffect(() => {
    if (sessionResult) return;
    let active = true;
    inFlight ??= resolveOnce();
    inFlight.then((result) => {
      sessionResult = result;
      inFlight = null;
      if (active) setState(result);
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
