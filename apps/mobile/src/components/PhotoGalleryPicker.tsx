/**
 * Generic multi-photo picker (trip galleries, etc.). Holds a flat list of
 * image URIs — remote `https://…` URLs already uploaded, or local
 * `file://`/`content://` URIs the caller uploads on submit. Unlike the
 * logbook `PhotoPicker` it carries no EXIF-date logic and takes its own cap.
 */
import * as ImagePicker from 'expo-image-picker';
import { Image, Pressable, Text, View } from 'react-native';
import { radius, spacing, useTheme } from '../theme';

interface PhotoGalleryPickerProps {
  uris: string[];
  onChange: (uris: string[]) => void;
  label?: string;
  max?: number;
}

export function PhotoGalleryPicker({ uris, onChange, label = 'Photos', max = 8 }: PhotoGalleryPickerProps) {
  const t = useTheme();

  async function add() {
    const remaining = max - uris.length;
    if (remaining <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
    });
    if (result.canceled || result.assets.length === 0) return;
    onChange([...uris, ...result.assets.map((a) => a.uri).slice(0, remaining)]);
  }

  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={[t.type.label, { color: t.colors.textSecondary }]}>
        {label} ({uris.length}/{max})
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        {uris.map((uri) => (
          <Pressable key={uri} onPress={() => onChange(uris.filter((u) => u !== uri))} style={{ alignItems: 'center' }}>
            <Image source={{ uri }} style={{ width: 72, height: 72, borderRadius: radius.chip }} />
            <Text style={[t.type.caption, { color: t.colors.danger }]}>Remove</Text>
          </Pressable>
        ))}
        {uris.length < max && (
          <Pressable
            onPress={add}
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
