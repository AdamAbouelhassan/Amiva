import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { colors, radius, spacing, typography } from '../../../theme';

interface DiscoverHomeScreenProps {
  navigation: { navigate: (screen: 'Feed' | 'Trending' | 'Recommendations') => void };
}

const ENTRIES: Array<{ screen: 'Feed' | 'Trending' | 'Recommendations'; title: string; description: string }> = [
  { screen: 'Feed', title: 'Feed', description: "What your friends have been up to, organized by what matches your travel style" },
  { screen: 'Trending', title: 'Trending', description: 'Popular this month across Amiva — not just your network' },
  { screen: 'Recommendations', title: 'For you', description: 'Places to go, pulled fresh from Google Places' },
];

export function DiscoverHomeScreen({ navigation }: DiscoverHomeScreenProps) {
  return (
    <ScreenContainer>
      <Text style={typography.displayMd}>Discover</Text>
      <View style={{ gap: spacing.md }}>
        {ENTRIES.map((entry) => (
          <Pressable key={entry.screen} style={styles.card} onPress={() => navigation.navigate(entry.screen)}>
            <Text style={typography.title}>{entry.title}</Text>
            <Text style={typography.bodySmall}>{entry.description}</Text>
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xxs,
  },
});
