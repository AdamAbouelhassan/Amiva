import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { toMatchPercent } from '@amiva/core';
import { MatchBadge } from '../../../components/MatchBadge';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { colors, spacing, typography } from '../../../theme';
import { useExperience } from '../../logbook/hooks/useExperiences';
import { TrendingScope, useTrending } from '../hooks/useTrending';

interface TrendingScreenProps {
  navigation: { navigate: (screen: 'ExperienceDetail', params: { experienceId: string }) => void };
}

export function TrendingScreen({ navigation }: TrendingScreenProps) {
  const [tab, setTab] = useState<'global' | 'personalized'>('global');
  const scope: TrendingScope = tab === 'global' ? { scope: 'global' } : { scope: 'personalized' };
  const { data: items = [], isLoading } = useTrending(scope, true);

  return (
    <ScreenContainer scroll={false}>
      <View style={{ padding: spacing.lg, gap: spacing.sm }}>
        <Text style={typography.displayMd}>Trending</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {(['global', 'personalized'] as const).map((t) => (
            <Pressable key={t} onPress={() => setTab(t)}>
              <Text style={[typography.subtitle, tab === t && { color: colors.accent }]}>
                {t === 'global' ? 'Global' : 'For you'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        data={items}
        keyExtractor={(item) => item.experienceId}
        refreshing={isLoading}
        renderItem={({ item }) => (
          <TrendingRow
            experienceId={item.experienceId}
            matchScore={item.matchScore}
            onPress={() => navigation.navigate('ExperienceDetail', { experienceId: item.experienceId })}
          />
        )}
      />
    </ScreenContainer>
  );
}

function TrendingRow({
  experienceId,
  matchScore,
  onPress,
}: {
  experienceId: string;
  matchScore?: number;
  onPress: () => void;
}) {
  const { data: experience } = useExperience(experienceId);
  if (!experience) return null;
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}
    >
      <View>
        <Text style={typography.subtitle}>{experience.title}</Text>
        <Text style={typography.bodySmall}>
          {experience.city}, {experience.country}
        </Text>
      </View>
      {matchScore !== undefined && <MatchBadge matchPercent={toMatchPercent(matchScore)} />}
    </Pressable>
  );
}
