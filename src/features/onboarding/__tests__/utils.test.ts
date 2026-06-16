import { getPersonaReviews, buildSchedulePreview } from '../utils';
import type { ProductivityPeak } from '@/types/onboarding';

beforeEach(() => {
  jest.resetModules();
});

describe('getPersonaReviews', () => {
  it('returns 3 reviews for a known persona', () => {
    const reviews = getPersonaReviews('student');
    expect(reviews).toHaveLength(3);
    expect(reviews[0].name).toBe('Sofia L.');
    expect(reviews[0].rating).toBe(5);
    expect(reviews[0].quote.length).toBeGreaterThan(10);
  });

  it('returns 3 reviews for "other" when persona is null', () => {
    const reviews = getPersonaReviews(null);
    expect(reviews).toHaveLength(3);
    expect(reviews[0].name).toBe('Sam T.');
  });

  it('falls back to "other" for unknown persona', () => {
    const reviews = getPersonaReviews('unknown_persona');
    expect(reviews).toHaveLength(3);
    expect(reviews[0].name).toBe('Sam T.');
  });

  it('returns different reviewer sets for different personas', () => {
    const student = getPersonaReviews('student');
    const parent = getPersonaReviews('parent');
    expect(student[0].name).not.toBe(parent[0].name);
  });
});

describe('buildSchedulePreview', () => {
  it('returns morning deep work block for morning peak', () => {
    const preview = buildSchedulePreview('07:00', 'morning');
    expect(preview.deepWorkBlock).toContain('8:00');
    expect(preview.bullets).toHaveLength(3);
    expect(preview.bullets[0]).toContain('morning');
  });

  it('returns afternoon deep work block for afternoon peak', () => {
    const preview = buildSchedulePreview('07:00', 'afternoon');
    expect(preview.deepWorkBlock).toContain('1:00');
    expect(preview.bullets[0]).toContain('afternoon');
  });

  it('returns evening deep work block for evening peak', () => {
    const preview = buildSchedulePreview('09:00', 'evening');
    expect(preview.deepWorkBlock).toContain('6:00');
    expect(preview.bullets[0]).toContain('evening');
  });

  it('returns rotating blocks for varies peak', () => {
    const preview = buildSchedulePreview('07:00', 'varies');
    expect(preview.deepWorkBlock).toContain('90-minute');
    expect(preview.bullets[0]).toContain('peak');
  });

  it('bullet points are always size 3', () => {
    const peaks: ProductivityPeak[] = ['morning', 'afternoon', 'evening', 'varies'];
    for (const peak of peaks) {
      const preview = buildSchedulePreview('07:00', peak);
      expect(preview.bullets).toHaveLength(3);
    }
  });
});
