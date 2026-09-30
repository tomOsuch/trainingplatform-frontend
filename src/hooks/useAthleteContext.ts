import { useOutletContext } from 'react-router-dom';

export interface AthleteContext {
  athleteId: number;
  onForbidden: () => void;
}

export function useAthleteContext(): AthleteContext | undefined {
  return useOutletContext<AthleteContext | undefined>() ?? undefined;
}
