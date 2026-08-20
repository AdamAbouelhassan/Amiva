/**
 * Up to 5 photos per experience (functional_specification.md §3.3),
 * enforced client-side here and server-side via
 * repositories/experienceRepository.ts's MAX_EXPERIENCE_PHOTOS check.
 */
import * as ImagePicker from 'expo-image-picker';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MAX_EXPERIENCE_PHOTOS } from '@amiva/core';
import { colors, radius, spacing, typography } from '../../../theme';

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
  async function addPhoto() {
    if (localUris.length >= MAX_EXPERIENCE_PHOTOS) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      exif: true,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    onChange([...localUris, asset.uri]);

    if (localUris.length === 0 && onExifDateDetected) {
      const raw = asset.exif?.DateTimeOriginal ?? asset.exif?.DateTime;
      const exifDate = typeof raw === 'string' ? parseExifDate(raw) : undefined;
      if (exifDate) onExifDateDetected(exifDate);
    }
  }

  function removePhoto(uri: string) {
    onChange(localUris.filter((u) => u !== uri));
  }

  return (
    <View>
      <Text style={typography.subtitle}>Photos ({localUris.length}/{MAX_EXPERIENCE_PHOTOS})</Text>
      <View style={styles.row}>
        {localUris.map((uri) => (
          <Pressable key={uri} onPress={() => removePhoto(uri)} style={styles.thumbWrapper}>
            <Image source={{ uri }} style={styles.thumb} />
            <Text style={styles.removeLabel}>Remove</Text>
          </Pressable>
        ))}
        {localUris.length < MAX_EXPERIENCE_PHOTOS && (
          <Pressable style={styles.addButton} onPress={addPhoto} accessibilityRole="button">
            <Text style={{ color: colors.accent, fontSize: 24 }}>+</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  thumbWrapper: {
    alignItems: 'center',
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: radius.sm,
  },
  removeLabel: {
    ...typography.caption,
    color: colors.danger,
  },
  addButton: {
    width: 72,
    height: 72,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
