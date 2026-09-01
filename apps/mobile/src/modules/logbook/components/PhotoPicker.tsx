/**
 * Up to 5 photos per experience (functional_specification.md §3.3),
 * enforced client-side here and server-side via
 * repositories/experienceRepository.ts's MAX_EXPERIENCE_PHOTOS check.
 */
import * as ImagePicker from 'expo-image-picker';
import { Pressable, Text, View } from 'react-native';
import { MAX_EXPERIENCE_PHOTOS } from '@amiva/core';
import { AppImage } from '../../../components/AppImage';
import { radius, spacing, useTheme } from '../../../theme';

interface PhotoPickerProps {
  localUris: string[];
  onChange: (uris: string[]) => void;
  /** Fired with the first photo's EXIF capture date, if present — the
   * default date source before a manual override
   * (functional_specification.md §3.3). */
  onExifDateDetected?: (date: Date) => void;
}

/** EXIF `DateTimeOriginal`/`DateTime` is formatted "YYYY:MM:DD HH:MM:SS"
 * (colons in the date portion, unlike ISO) — reformat before parsing. */
function parseExifDate(value: string): Date | undefined {
  const match = value.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return undefined;
  const [, year, month, day, hour, minute, second] = match;
  const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function PhotoPicker({ localUris, onChange, onExifDateDetected }: PhotoPickerProps) {
  const t = useTheme();

  async function addPhoto() {
    const remaining = MAX_EXPERIENCE_PHOTOS - localUris.length;
    if (remaining <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      exif: true,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
    });
    if (result.canceled || result.assets.length === 0) return;

    const wasEmpty = localUris.length === 0;
    onChange([...localUris, ...result.assets.map((a) => a.uri).slice(0, remaining)]);

    if (wasEmpty && onExifDateDetected) {
      const raw = result.assets[0]?.exif?.DateTimeOriginal ?? result.assets[0]?.exif?.DateTime;
      const exifDate = typeof raw === 'string' ? parseExifDate(raw) : undefined;
      if (exifDate) onExifDateDetected(exifDate);
    }
  }

  function removePhoto(uri: string) {
    onChange(localUris.filter((u) => u !== uri));
  }

  return (
    <View>
      <Text style={t.type.subtitle}>
        Photos ({localUris.length}/{MAX_EXPERIENCE_PHOTOS})
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs }}>
        {localUris.map((uri) => (
          <Pressable key={uri} onPress={() => removePhoto(uri)} style={{ alignItems: 'center' }}>
            <AppImage uri={uri} style={{ width: 72, height: 72, borderRadius: radius.chip }} />
            <Text style={[t.type.caption, { color: t.colors.danger }]}>Remove</Text>
          </Pressable>
        ))}
        {localUris.length < MAX_EXPERIENCE_PHOTOS && (
          <Pressable
            onPress={addPhoto}
            accessibilityRole="button"
            style={{
              width: 72,
              height: 72,
              borderRadius: radius.chip,
              borderWidth: 1,
              borderColor: t.colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: t.colors.accent, fontSize: 24 }}>+</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
