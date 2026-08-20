/**
 * Planned trip detail: unordered itinerary checklist, adding items from
 * saved (priority) then recommended sources (functional_specification.md
 * §4.2), and the completion flow prompting logbook conversion per item
 * with a skip option (§4.3).
 */
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { TravelStyleVector, zeroTravelStyleVector } from '@amiva/core';
import { Button } from '../../../components/Button';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TextField } from '../../../components/TextField';
import { TravelStyleSliders } from '../../../components/TravelStyleSliders';
import { colors, spacing, typography } from '../../../theme';
import { StarRating } from '../../logbook/components/StarRating';
import { usePlannedTrip, usePlannedTripItems } from '../../../hooks/usePlannedTripData';
import { ConversionDecision, useConvertPlannedTrip } from '../hooks/useConvertPlannedTrip';
import { useAddPlannedTripItem, useSetPlannedTripStatus } from '../hooks/usePlannedTrips';
import { useSavedExperiences } from '../hooks/useSavedExperiences';

interface PlannedTripDetailScreenProps {
  route: { params: { plannedTripId: string } };
}

export function PlannedTripDetailScreen({ route }: PlannedTripDetailScreenProps) {
  const { plannedTripId } = route.params;
  const { data: trip } = usePlannedTrip(plannedTripId);
  const { data: items = [] } = usePlannedTripItems(plannedTripId);
  const { data: savedExperiences } = useSavedExperiences();
  const addItem = useAddPlannedTripItem();
  const setStatus = useSetPlannedTripStatus();

  const [completing, setCompleting] = useState(false);
  const [decisions, setDecisions] = useState<Record<string, ConversionDecision>>({});
  const convert = useConvertPlannedTrip(plannedTripId);

  if (!trip) return null;

  const savedNotYetAdded = savedExperiences.filter((e) => !items.some((item) => item.placeId === e.placeId));

  async function submitConversion() {
    await convert.mutateAsync(items.map((item) => decisions[item.itemId] ?? { itemId: item.itemId, action: 'skip' }));
    await setStatus.mutateAsync({ plannedTripId, status: 'completed' });
    setCompleting(false);
  }

  return (
    <ScreenContainer>
      <Text style={typography.displayMd}>{trip.locations.join(', ')}</Text>
      <Text style={typography.bodySmall}>Status: {trip.status}</Text>

      {trip.status !== 'completed' && !completing && (
        <Button label="Mark trip completed" variant="secondary" onPress={() => setCompleting(true)} />
      )}

      {completing ? (
        <View style={{ gap: spacing.md }}>
          <Text style={typography.subtitle}>Convert items to your Logbook</Text>
          {items.map((item) => (
            <ConversionRow
              key={item.itemId}
              itemId={item.itemId}
              title={item.title}
              decision={decisions[item.itemId]}
              onChange={(d) => setDecisions((prev) => ({ ...prev, [item.itemId]: d }))}
            />
          ))}
          <Button label="Finish" onPress={submitConversion} loading={convert.isPending || setStatus.isPending} />
        </View>
      ) : (
        <>
          <View style={{ gap: spacing.xs }}>
            <Text style={typography.subtitle}>Itinerary</Text>
            {items.map((item) => (
              <Text key={item.itemId} style={typography.body}>
                • {item.title} ({item.source})
              </Text>
            ))}
            {items.length === 0 && <Text style={typography.body}>Nothing added yet.</Text>}
          </View>

          <View style={{ gap: spacing.xs }}>
            <Text style={typography.subtitle}>Add from your saves</Text>
            {savedNotYetAdded.map((experience) => (
              <Pressable
                key={experience.experienceId}
                onPress={() =>
                  addItem.mutate({
                    plannedTripId,
                    source: 'saved',
                    placeId: experience.placeId,
                    title: experience.title,
                    categoryScores: experience.categoryScores,
                  })
                }
                style={{ paddingVertical: spacing.xxs }}
              >
                <Text style={{ color: colors.accent }}>+ {experience.title}</Text>
              </Pressable>
            ))}
            {savedNotYetAdded.length === 0 && <Text style={typography.bodySmall}>No saved experiences to add.</Text>}
          </View>
        </>
      )}
    </ScreenContainer>
  );
}

function ConversionRow({
  itemId,
  title,
  decision,
  onChange,
}: {
  itemId: string;
  title: string;
  decision: ConversionDecision | undefined;
  onChange: (d: ConversionDecision) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [categoryScores, setCategoryScores] = useState<TravelStyleVector>(zeroTravelStyleVector());

  return (
    <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.sm, gap: spacing.xs }}>
      <Text style={typography.subtitle}>{title}</Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Button label="Skip" variant="secondary" onPress={() => onChange({ itemId, action: 'skip' })} />
        <Button label={expanded ? 'Editing…' : 'Log it'} onPress={() => setExpanded(true)} />
      </View>
      {expanded && (
        <View style={{ gap: spacing.sm }}>
          <StarRating value={rating} onChange={setRating} />
          <TextField label="Notes" value={notes} onChangeText={setNotes} multiline />
          <TravelStyleSliders value={categoryScores} onChange={setCategoryScores} />
          <Button
            label="Confirm"
            onPress={() =>
              onChange({
                itemId,
                action: 'convert',
                details: { photoUrls: [], rating, notes, categoryScores, date: new Date().toISOString(), dateSource: 'manual' },
              })
            }
          />
        </View>
      )}
      {decision && <Text style={typography.caption}>{decision.action === 'skip' ? 'Will skip' : 'Ready to log'}</Text>}
    </View>
  );
}
