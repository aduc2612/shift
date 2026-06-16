import { buildSystemPrompt } from '../ai-prompt';
import type { UserPreferences } from '@/types/userPreferences';

const BASE_PREFS: UserPreferences = {
  userId: 'u1',
  productivityPeak: 'morning',
  wakeUpTime: '07:00',
  schedulingContext: '',
  onboardingCompleted: true,
  persona: null,
  sleepTime: null,
  painPoints: [],
  hardConstraints: [],
};

describe('buildSystemPrompt', () => {
  it('returns empty string when only defaults are set and no context', () => {
    const result = buildSystemPrompt(BASE_PREFS);
    // morning peak with no persona/context — should produce some text
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('07:00');
  });

  it('includes persona when set', () => {
    const prefs = { ...BASE_PREFS, persona: 'student' as const };
    const result = buildSystemPrompt(prefs);
    expect(result).toContain('Student');
  });

  it('includes sleep time when set', () => {
    const prefs = { ...BASE_PREFS, sleepTime: '23:00' };
    const result = buildSystemPrompt(prefs);
    expect(result).toContain('23:00');
  });

  it('includes hard constraints when present', () => {
    const prefs = { ...BASE_PREFS, hardConstraints: ['morning_routine', 'work_hours'] };
    const result = buildSystemPrompt(prefs);
    expect(result).toContain('morning routine');
    expect(result).toContain('work hours');
  });

  it('handles "none" constraint by stating flexibility', () => {
    const prefs = { ...BASE_PREFS, hardConstraints: ['none'] };
    const result = buildSystemPrompt(prefs);
    expect(result).toContain('No prioritized tasks');
    expect(result).toContain('flexibility');
  });

  it('includes scheduling context verbatim', () => {
    const prefs = { ...BASE_PREFS, schedulingContext: 'I have ADHD' };
    const result = buildSystemPrompt(prefs);
    expect(result).toContain('I have ADHD');
  });

  it('produces a non-empty prompt for a fully populated profile', () => {
    const prefs = {
      ...BASE_PREFS,
      persona: 'freelancer' as const,
      sleepTime: '02:00',
      productivityPeak: 'evening' as const,
      hardConstraints: ['childcare'],
      schedulingContext: 'need deep work blocks without interruptions',
    };
    const result = buildSystemPrompt(prefs);
    expect(result).toContain('Freelancer');
    expect(result).toContain('evening');
    expect(result).toContain('childcare');
    expect(result).toContain('deep work blocks');
    expect(result.length).toBeGreaterThan(100);
  });

  it('handles varies productivity peak without crashing', () => {
    const prefs = { ...BASE_PREFS, productivityPeak: 'varies' as const };
    const result = buildSystemPrompt(prefs);
    expect(result).toContain('varies');
  });
});
