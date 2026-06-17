import { getPersonaReviews, buildSchedulePreview, buildUserContextText } from '../utils';
import type { OnboardingData, ProductivityPeak } from '@/types/onboarding';

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
    const preview = buildSchedulePreview('morning');
    expect(preview.deepWorkBlock).toContain('8:00');
    expect(preview.bullets).toHaveLength(3);
    expect(preview.bullets[0]).toContain('morning');
  });

  it('returns afternoon deep work block for afternoon peak', () => {
    const preview = buildSchedulePreview('afternoon');
    expect(preview.deepWorkBlock).toContain('1:00');
    expect(preview.bullets[0]).toContain('afternoon');
  });

  it('returns evening deep work block for evening peak', () => {
    const preview = buildSchedulePreview('evening');
    expect(preview.deepWorkBlock).toContain('6:00');
    expect(preview.bullets[0]).toContain('evening');
  });

  it('returns rotating blocks for varies peak', () => {
    const preview = buildSchedulePreview('varies');
    expect(preview.deepWorkBlock).toContain('90-minute');
    expect(preview.bullets[0]).toContain('peak');
  });

  it('bullet points are always size 3', () => {
    const peaks: ProductivityPeak[] = ['morning', 'afternoon', 'evening', 'varies'];
    for (const peak of peaks) {
      const preview = buildSchedulePreview(peak);
      expect(preview.bullets).toHaveLength(3);
    }
  });
});

const FULL_DATA: OnboardingData = {
  persona: 'student',
  painPoints: ['delay_collapse', 'anxiety'],
  sleepTime: '23:00',
  wakeUpTime: '07:00',
  productivityPeak: 'morning',
  hardConstraints: ['morning_routine', 'work_hours'],
  schedulingContext: 'I have a part-time job',
};

describe('buildUserContextText', () => {
  it('formats a fully populated profile', () => {
    const out = buildUserContextText(FULL_DATA);
    expect(out).toContain('Role: Student');
    expect(out).toContain('Pain points:');
    expect(out).toContain(' + One delay collapses my whole schedule');
    expect(out).toContain(' + My to-do list gives me more anxiety than clarity');
    expect(out).toContain('Priorities:');
    expect(out).toContain(' + Morning routine / gym');
    expect(out).toContain(' + Work hours');
    expect(out).toContain('Productivity peak: Morning');
    expect(out).toContain('Additional context: I have a part-time job');
  });

  it('omits the Role line for "other" persona', () => {
    const out = buildUserContextText({ ...FULL_DATA, persona: 'other' });
    expect(out).not.toContain('Role:');
  });

  it('omits the Role line for null persona', () => {
    const out = buildUserContextText({ ...FULL_DATA, persona: null });
    expect(out).not.toContain('Role:');
  });

  it('omits Pain points section when empty', () => {
    const out = buildUserContextText({ ...FULL_DATA, painPoints: [] });
    expect(out).not.toContain('Pain points');
  });

  it('writes "full flexibility" when hardConstraints includes "none"', () => {
    const out = buildUserContextText({ ...FULL_DATA, hardConstraints: ['none'] });
    expect(out).toContain('Priorities: None — full flexibility');
    const prioritiesSection = out.split('Priorities:')[1] ?? '';
    expect(prioritiesSection).not.toContain(' + ');
  });

  it('filters out "none" when mixed with real constraints', () => {
    const out = buildUserContextText({ ...FULL_DATA, hardConstraints: ['none', 'school'] });
    expect(out).toContain('Priorities:');
    expect(out).toContain(' + School or class schedule');
    expect(out).not.toContain('None — full flexibility');
  });

  it('omits Priorities section when empty', () => {
    const out = buildUserContextText({ ...FULL_DATA, hardConstraints: [] });
    expect(out).not.toContain('Priorities');
  });

  it('omits Additional context when schedulingContext is empty/whitespace', () => {
    expect(buildUserContextText({ ...FULL_DATA, schedulingContext: '' })).not.toContain('Additional context');
    expect(buildUserContextText({ ...FULL_DATA, schedulingContext: '   ' })).not.toContain('Additional context');
  });

  it('returns empty string when all fields are empty', () => {
    const out = buildUserContextText({
      persona: null,
      painPoints: [],
      sleepTime: '23:00',
      wakeUpTime: '07:00',
      productivityPeak: null,
      hardConstraints: [],
      schedulingContext: '',
    });
    expect(out).toBe('');
  });
});
