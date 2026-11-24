import { TrainingPlan } from '../types/workout';
import { planToItem, tileTitle } from './calendarItems';

const ME = 7;

const base: TrainingPlan = {
  id: 1,
  title: 'Interwały',
  categoryId: 1,
  categoryName: 'Taniec',
  categoryColor: '#9B59B6',
  categoryIconName: 'music',
  plannedDate: '2026-11-20',
  plannedTime: null,
  durationMin: 60,
  notes: null,
  status: 'PLANNED',
  createdByCoach: false,
  createdByName: null,
  createdById: null,
};

const mine: TrainingPlan = { ...base, createdByCoach: true, createdByName: 'Jan Kowalski', createdById: ME };
const otherCoach: TrainingPlan = { ...base, createdByCoach: true, createdByName: 'Marta Zielińska', createdById: 8 };

describe('oznaczenie planów od trenera', () => {
  test('we własnym kalendarzu każdy plan od trenera ma bursztyn i nazwisko autora', () => {
    const item = planToItem(otherCoach);
    expect(item.fromCoach).toBe(true);
    expect(item.byViewer).toBe(false);
    expect(tileTitle(item)).toBe('Interwały · od trenera: Marta Zielińska');
  });

  test('w trybie podopiecznego bursztyn ma tylko plan oglądającego trenera', () => {
    const own = planToItem(mine, ME);
    expect(own.fromCoach).toBe(true);
    expect(tileTitle(own)).toBe('Interwały · ułożony przez Ciebie');

    const foreign = planToItem(otherCoach, ME);
    expect(foreign.fromCoach).toBe(false);
    expect(tileTitle(foreign)).toBe('Interwały');
  });

  test('plan samego podopiecznego nie jest oznaczony w żadnym trybie', () => {
    expect(planToItem(base).fromCoach).toBe(false);
    expect(planToItem(base, ME).fromCoach).toBe(false);
  });
});
