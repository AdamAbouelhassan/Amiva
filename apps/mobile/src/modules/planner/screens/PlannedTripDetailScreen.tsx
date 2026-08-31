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
import { radius, spacing, useTheme } from '../../../theme';
import { StatusSteps } from '../components/StatusSteps';
import { StarRating } from '../../logbook/components/StarRating';
import { usePlannedTrip, usePlannedTripItems } from '../../../hooks/usePlannedTripData';
import { ConversionDecision, useConvertPlannedTrip } from '../hooks/useConvertPlannedTrip';
import { useAddPlannedTripItem, useSetPlannedTripStatus } from '../hooks/usePlannedTrips';
import { useSavedExperiences } from '../hooks/useSavedExperiences';
import { useSavedPlaces } from '../hooks/useSavedPlaces';

interface PlannedTripDetailScreenProps {
  route: { params: { plannedTripId: string } };
}

export function PlannedTripDetailScreen({ route }: PlannedTripDetailScreenProps) {
  const t = useTheme();
  const { plannedTripId } = route.params;
  const { data: trip } = usePlannedTrip(plannedTripId);
  const { data: items = [] } = usePlannedTripItems(plannedTripId);
  const { data: savedExperiences } = useSavedExperiences();
  const { data: savedPlaces } = useSavedPlaces();
  const addItem = useAddPlannedTripItem();
  const setStatus = useSetPlannedTripStatus();

  const [completing, setCompleting] = useState(false);
  const [decisions, setDecisions] = useState<Record<string, ConversionDecision>>({});
  const convert = useConvertPlannedTrip(plannedTripId);

  if (!trip) return null;

  const savedNotYetAdded = savedExperiences.filter((e) => !items.some((item) => item.placeId === e.placeId));
  const savedPlacesNotYetAdded = savedPlaces.filter((p) => !items.some((item) => item.placeId === p.placeId));

  async function submitConversion() {
    await convert.mutateAsync(items.map((item) => decisions[item.itemId] ?? { itemId: item.itemId, action: 'skip' }));
    await setStatus.mutateAsync({ plannedTripId, status: 'completed' });
    setCompleting(false);
  }

  return (
    <ScreenContainer>
      <Text style={t.type.displayMd}>{trip.locations.join(', ')}</Text>
      <StatusSteps status={trip.status} />

      {trip.status !== 'completed' && !completing && (
        <Button label="Mark trip completed" variant="warm" onPress={() => setCompleting(true)} />
      )}

      {completing ? (
        <View style={{ gap: spacing.md }}>
          <Text style={t.type.subtitle}>Convert items to your Logbook</Text>
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
            <Text style={t.type.subtitle}>Itinerary</Text>
            {items.map((item) => (
              <Text key={item.itemId} style={t.type.body}>
                • {item.title} ({item.source})
              </Text>
            ))}
            {items.length === 0 && <Text style={t.type.body}>Nothing added yet.</Text>}
          </View>

          <View style={{ gap: spacing.xs }}>
            <Text style={t.type.subtitle}>Add from your saves</Text>
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
                <Text style={{ color: t.colors.accent }}>+ {experience.title}</Text>
              </Pressable>
            ))}
            {savedNotYetAdded.length === 0 && <Text style={t.type.bodySmall}>No saved experiences to add.</Text>}
          </View>

          <View style={{ gap: spacing.xs }}>
            <Text style={t.type.subtitle}>Add from your saved places</Text>
            {savedPlacesNotYetAdded.map((place) => (
              <Pressable
                key={place.placeId}
                onPress={() =>
                  addItem.mutate({
                    plannedTripId,
                    source: 'recommended',
                    placeId: place.placeId,
                    title: place.name,
                    categoryScores: place.categoryScores,
                  })
                }
                style={{ paddingVertical: spacing.xxs }}
              >
                <Text style={{ color: t.colors.accent }}>+ {place.name}</Text>
              </Pressable>
            ))}
            {savedPlacesNotYetAdded.length === 0 && <Text style={t.type.bodySmall}>No saved places to add.</Text>}
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
  const t = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [categoryScores, setCategoryScores] = useState<TravelStyleVector>(zeroTravelStyleVector());

  return (
    <View style={{ borderWidth: 1, borderColor: t.colors.border, borderRadius: radius.card, padding: spacing.sm, gap: spacing.xs }}>
      <Text style={t.type.subtitle}>{title}</Text>
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
      {decision && <Text style={t.type.caption}>{decision.action === 'skip' ? 'Will skip' : 'Ready to log'}</Text>}
    </View>
  );
}
