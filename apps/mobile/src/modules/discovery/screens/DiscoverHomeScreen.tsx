import { Pressable, Text, View } from 'react-native';
import { Card } from '../../../components/Card';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { spacing, useTheme } from '../../../theme';

interface DiscoverHomeScreenProps {
  navigation: { navigate: (screen: 'Feed' | 'Trending' | 'Recommendations') => void };
}

const ENTRIES: Array<{
  screen: 'Feed' | 'Trending' | 'Recommendations';
  title: string;
  description: string;
}> = [
  {
    screen: 'Feed',
    title: 'Feed',
    description: 'What your friends have been up to, ranked by how it matches your style',
  },
  { screen: 'Trending', title: 'Trending', description: 'Popular this month across Amiva — not just your network' },
  { screen: 'Recommendations', title: 'For you', description: 'Places to go, pulled fresh from Google Places' },
];

export function DiscoverHomeScreen({ navigation }: DiscoverHomeScreenProps) {
  const t = useTheme();
  return (
    <ScreenContainer>
      <Text style={t.type.displayMd}>Discover</Text>
      <View style={{ gap: spacing.md }}>
        {ENTRIES.map((entry) => (
          <Pressable key={entry.screen} onPress={() => navigation.navigate(entry.screen)}>
            <Card elevation="raised" style={{ gap: spacing.xxs }}>
              <Text style={t.type.title}>{entry.title}</Text>
              <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]}>{entry.description}</Text>
            </Card>
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}
