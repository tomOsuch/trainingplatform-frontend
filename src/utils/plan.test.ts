import { TrainingPlan } from '../types/workout';
import { canCoachEditPlan } from './plan';

const base: TrainingPlan = {
  id: 1,
  title: 'Interwały 6×400',
  categoryId: 1,
  categoryName: 'Taniec',
  categoryColor: '#9B59B6',
  categoryIconName: 'music',
  plannedDate: '2026-11-03',
  plannedTime: '18:00:00',
  durationMin: 60,
  notes: null,
  status: 'PLANNED',
  createdByCoach: false,
  createdByName: null,
  createdById: null,
};

const ME = 7;

describe('canCoachEditPlan', () => {
  test('trener edytuje plan, który sam ułożył', () => {
    const mine = { ...base, createdByCoach: true, createdByName: 'Jan Kowalski', createdById: ME };
    expect(canCoachEditPlan(mine, ME)).toBe(true);
  });

  test('plan innego trenera tego samego podopiecznego jest tylko do odczytu', () => {
    const other = { ...base, createdByCoach: true, createdByName: 'Marta Zielińska', createdById: 8 };
    expect(canCoachEditPlan(other, ME)).toBe(false);
  });

  test('plan ułożony przez samego podopiecznego jest tylko do odczytu', () => {
    expect(canCoachEditPlan(base, ME)).toBe(false);
  });

  test('bez zalogowanego użytkownika nikt nie edytuje — także plan bez autora', () => {
    expect(canCoachEditPlan(base, undefined)).toBe(false);
  });
});