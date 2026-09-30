export function scope(athleteId?: number): string {
  return athleteId === undefined ? '' : `/coach/athletes/${athleteId}`;
}