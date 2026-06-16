import { getPersonaReview, buildSchedulePreview } from '../utils';
import type { ProductivityPeak } from '@/types/onboarding';

beforeEach(() => {
  jest.resetModules();
});

describe('getPersonaReview', () => {
  it('returns a review for a known persona', () => {
    const review = getPersonaReview('student');
    expect(review).toBeDefined();
    expect(review.name).toBe('Sofia L.');
    expect(review.rating).toBe(5);
    expect(review.quote.length).toBeGreaterThan(10);
  });

  it('returns a review for "other" when persona is null', () => {
    const review = getPersonaReview(null);
    expect(review.name).toBe('Sam T.');
  });

  it('falls back to "other" for unknown persona', () => {
    const review = getPersonaReview('unknown_persona');
    expect(review.name).toBe('Sam T.');
  });

  it('returns different reviews for different personas', () => {
    const student = getPersonaReview('student');
    const parent = getPersonaReview('parent');
    expect(student.name).not.toBe(parent.name);
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
