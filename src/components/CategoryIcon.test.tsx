import { render } from '@testing-library/react';
import CategoryIcon, { isKnownIcon } from './CategoryIcon';

describe('CategoryIcon', () => {
  // nazwy pochodzą z zamkniętej listy backendu; ten test pilnuje, że tablica tłumaczeń
  // nadąża za zestawem także po podbiciu wersji lucide-react
  const NAMES = [
    'dumbbell', 'footprints', 'volleyball', 'trophy', 'bike', 'waves', 'heart-pulse', 'activity',
    'flame', 'mountain', 'music', 'target', 'timer', 'medal', 'zap', 'person-standing',
  ];

  test.each(NAMES)('zna nazwę "%s"', (name) => {
    expect(isKnownIcon(name)).toBe(true);
  });

  test('nieznana nazwa nie wywraca renderu i zostawia ślad w konsoli', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() => render(<CategoryIcon name="nie-ma-takiej" />)).not.toThrow();
    expect(isKnownIcon('nie-ma-takiej')).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('nie-ma-takiej'));

    warn.mockRestore();
  });
});