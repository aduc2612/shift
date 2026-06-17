import { buildSystemPrompt } from '../ai-prompt';
import type { UserPreferences } from '@/types/userPreferences';

const BASE_PREFS: UserPreferences = {
  userId: 'u1',
  wakeUpTime: '07:00',
  sleepTime: '23:00',
  userContext: '',
  onboardingCompleted: true,
};

describe('buildSystemPrompt', () => {
  it('includes wake/sleep window', () => {
    const result = buildSystemPrompt(BASE_PREFS);
    expect(result).toContain('07:00');
    expect(result).toContain('23:00');
  });

  it('includes userContext verbatim', () => {
    const prefs = { ...BASE_PREFS, userContext: 'Role: Student\nPriorities:\n + School' };
    const result = buildSystemPrompt(prefs);
    expect(result).toContain('Role: Student');
    expect(result).toContain(' + School');
  });

  it('omits userContext when empty', () => {
    const result = buildSystemPrompt(BASE_PREFS);
    expect(result).not.toContain('Role:');
  });

  it('produces a non-empty prompt for a fully populated profile', () => {
    const prefs = {
      ...BASE_PREFS,
      userContext: 'Role: Freelancer\nPriorities:\n + Childcare or pickups\nAdditional context: need deep work blocks without interruptions',
    };
    const result = buildSystemPrompt(prefs);
    expect(result).toContain('Freelancer');
    expect(result).toContain('Childcare or pickups');
    expect(result).toContain('deep work blocks');
    expect(result.length).toBeGreaterThan(50);
  });

  it('returns empty string when onboarding not completed', () => {
    const prefs = { ...BASE_PREFS, onboardingCompleted: false };
    const result = buildSystemPrompt(prefs);
    expect(result).toBe('');
  });
});
