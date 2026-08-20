import { useMemo } from 'react';
import { ExperienceDoc } from '../../../repositories/types';
import { useOwnerExperiences } from './useExperiences';

export interface CountrySummary {
  country: string;
  cities: string[];
  experienceCount: number;
}

/** Country > City > Experience drill-down + aggregate stats
 * (functional_specification.md §3.1, §3.5), derived client-side from the
 * owner's experience list — no separate aggregate document to keep in
 * sync. */
export function useLogbookDrilldown(ownerId: string | undefined) {
  const query = useOwnerExperiences(ownerId);

  const grouped = useMemo(() => {
    const experiences = query.data ?? [];
    const byCountry = new Map<string, Map<string, ExperienceDoc[]>>();

    for (const experience of experiences) {
      if (!byCountry.has(experience.country)) byCountry.set(experience.country, new Map());
      const cityMap = byCountry.get(experience.country)!;
      if (!cityMap.has(experience.city)) cityMap.set(experience.city, []);
      cityMap.get(experience.city)!.push(experience);
    }

    const countries: CountrySummary[] = [...byCountry.entries()].map(([country, cityMap]) => ({
      country,
      cities: [...cityMap.keys()],
      experienceCount: [...cityMap.values()].reduce((sum, list) => sum + list.length, 0),
    }));

    return {
      countries,
      stats: {
        countryCount: countries.length,
        cityCount: [...byCountry.values()].reduce((sum, cityMap) => sum + cityMap.size, 0),
        experienceCount: experiences.length,
      },
      byCountryAndCity: byCountry,
    };
  }, [query.data]);

  return { ...grouped, isLoading: query.isLoading, experiences: query.data ?? [] };
}
