import { useQuery } from '@tanstack/react-query';
import { Text, View } from 'react-native';
import { AppImage } from '../../../components/AppImage';
import { Avatar } from '../../../components/Avatar';
import { Card } from '../../../components/Card';
import { orNull } from '../../../lib/queryHelpers';
import { timeAgo } from '../../../lib/timeAgo';
import { UserRepository } from '../../../repositories/userRepository';
import { spacing, useTheme } from '../../../theme';
import type { ActivityItem } from '../hooks/useFriendsActivity';
import { FeedItemCard } from './FeedItemCard';

interface ActivityCardProps {
  item: ActivityItem;
  onOpenExperience: (experienceId: string) => void;
}

const VERB: Record<ActivityItem['kind'], string> = {
  experience_logged: 'logged an experience',
  experience_saved: 'liked an experience',
  trip_logged: 'logged a trip',
  planned_trip_completed: 'completed a trip',
  friend_added: 'made a new connection',
};

function useUser(uid: string | null | undefined) {
  return useQuery({
    queryKey: ['users', uid],
    queryFn: () => UserRepository.getById(uid!).then(orNull),
    enabled: !!uid,
  });
}

export function ActivityCard({ item, onOpenExperience }: ActivityCardProps) {
  const t = useTheme();
  const { data: actor } = useUser(item.actorId);
  const { data: other } = useUser(item.kind === 'friend_added' ? item.otherId : undefined);

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
      <Avatar uri={actor?.profilePhotoUrl} size={28} name={actor?.name} />
      <Text style={[t.type.bodySmall, { flex: 1, color: t.colors.textSecondary }]} numberOfLines={1}>
        <Text style={{ color: t.colors.textPrimary, fontFamily: t.type.subtitle.fontFamily }}>
          {actor?.name ?? '…'}
        </Text>{' '}
        {VERB[item.kind]}
      </Text>
      <Text style={[t.type.caption, { color: t.colors.textSecondary }]}>{timeAgo(item.createdAt)}</Text>
    </View>
  );

  if (item.kind === 'experience_logged' || item.kind === 'experience_saved') {
    return (
      <View style={{ gap: spacing.xs }}>
        {header}
        <FeedItemCard experienceId={item.experienceId} onPress={() => onOpenExperience(item.experienceId)} />
      </View>
    );
  }

  if (item.kind === 'trip_logged') {
    return (
      <View style={{ gap: spacing.xs }}>
        {header}
        <Card padded={false} elevation="raised" style={{ overflow: 'hidden' }}>
          <AppImage
            uri={item.trip.coverPhotoUrl}
            style={{ width: '100%', height: item.trip.coverPhotoUrl ? 150 : 64 }}
          />
          <View style={{ padding: spacing.md, gap: 2 }}>
            <Text style={t.type.subtitle} numberOfLines={1}>
              {item.trip.name}
            </Text>
            <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]}>
              {item.trip.location || '—'} · {new Date(item.trip.startDate).toLocaleDateString()} –{' '}
              {new Date(item.trip.endDate).toLocaleDateString()}
            </Text>
          </View>
        </Card>
      </View>
    );
  }

  if (item.kind === 'planned_trip_completed') {
    return (
      <View style={{ gap: spacing.xs }}>
        {header}
        <Card padded style={{ borderLeftWidth: 3, borderLeftColor: t.colors.accentWarm }}>
          <Text style={t.type.body}>{item.location || 'A planned trip'}</Text>
        </Card>
      </View>
    );
  }

  // friend_added
  return (
    <View style={{ gap: spacing.xs }}>
      {header}
      <Card padded style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Avatar uri={other?.profilePhotoUrl} size={36} name={other?.name ?? '?'} />
        <Text style={t.type.body}>
          {item.otherId ? (other?.name ?? '…') : 'someone new'}
        </Text>
      </Card>
    </View>
  );
}
