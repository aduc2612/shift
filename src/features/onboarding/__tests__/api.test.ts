import type { OnboardingData } from '@/types/onboarding';

let mockFromResult: unknown;

jest.mock('@/services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      upsert: jest.fn(() => mockFromResult),
    })),
  },
}));

import { saveOnboardingData } from '../api';

const USER_ID = 'test-user-id';
const MOCK_DATA: OnboardingData = {
  persona: 'student',
  painPoints: ['delay_collapse', 'anxiety'],
  sleepTime: '23:00',
  wakeUpTime: '07:00',
  productivityPeak: 'morning',
  hardConstraints: ['school'],
  schedulingContext: 'test context',
};

describe('saveOnboardingData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFromResult = { error: null };
  });

  it('resolves when upsert succeeds', async () => {
    await expect(saveOnboardingData(USER_ID, MOCK_DATA)).resolves.toBeUndefined();
  });

  it('throws when upsert has error', async () => {
    mockFromResult = { error: new Error('DB error') };
    await expect(saveOnboardingData(USER_ID, MOCK_DATA)).rejects.toThrow(
      /saveOnboardingData failed.*DB error/,
    );
  });
});
