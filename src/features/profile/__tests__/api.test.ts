type SupabaseAuth = {
  getUser: jest.Mock;
};

const mockGetUser = jest.fn() as jest.Mock;
const mockAuth: SupabaseAuth = { getUser: mockGetUser };

const mockFrom = jest.fn() as jest.Mock;
const mockSelect = jest.fn() as jest.Mock;
const mockEq = jest.fn() as jest.Mock;
const mockMaybeSingle = jest.fn() as jest.Mock;
const mockUpdate = jest.fn() as jest.Mock;
const mockUpsert = jest.fn() as jest.Mock;

jest.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      getUser: () => mockAuth.getUser(),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import { fetchUserProfile, fetchUserPreferences, updateUserPreferences } from '../api';

describe('fetchUserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns email and name from authenticated user', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'u-1',
          email: 'jordan@example.com',
          user_metadata: { full_name: 'Jordan Doe' },
        },
      },
      error: null,
    });

    const profile = await fetchUserProfile();
    expect(profile.email).toBe('jordan@example.com');
    expect(profile.name).toBe('Jordan Doe');
  });

  it('returns empty name when no full_name in metadata', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'u-1',
          email: 'a@b.com',
          user_metadata: {},
        },
      },
      error: null,
    });

    const profile = await fetchUserProfile();
    expect(profile.name).toBe('');
  });

  it('throws when no user is signed in', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(fetchUserProfile()).rejects.toThrow(/not signed in/);
  });

  it('throws when supabase returns an error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'auth error' },
    });
    await expect(fetchUserProfile()).rejects.toThrow(/auth error/);
  });
});

describe('fetchUserPreferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom.mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          maybeSingle: mockMaybeSingle,
        }),
      }),
    });
  });

  it('returns preferences row', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        user_id: 'u-1',
        wake_up_time: '07:00',
        sleep_time: '23:00',
        user_context: 'I work nights',
        onboarding_completed: true,
      },
      error: null,
    });

    const prefs = await fetchUserPreferences('u-1');
    expect(prefs.wakeUpTime).toBe('07:00');
    expect(prefs.sleepTime).toBe('23:00');
    expect(prefs.userContext).toBe('I work nights');
    expect(prefs.onboardingCompleted).toBe(true);
  });

  it('returns default preferences when no row exists', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const prefs = await fetchUserPreferences('u-1');
    expect(prefs.wakeUpTime).toBe('07:00');
    expect(prefs.userContext).toBe('');
  });

  it('throws on supabase error', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { message: 'DB down' },
    });
    await expect(fetchUserPreferences('u-1')).rejects.toThrow(/DB down/);
  });
});

describe('updateUserPreferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom.mockReturnValue({
      upsert: mockUpsert.mockResolvedValue({ error: null }),
    });
  });

  it('calls supabase upsert with mapped fields', async () => {
    await updateUserPreferences('u-1', {
      wakeUpTime: '08:30',
      sleepTime: '00:00',
      userContext: 'updated',
    });

    expect(mockFrom).toHaveBeenCalledWith('user_preferences');
    expect(mockUpsert).toHaveBeenCalledWith(
      { user_id: 'u-1', wake_up_time: '08:30', sleep_time: '00:00', user_context: 'updated' },
      { onConflict: 'user_id' },
    );
  });

  it('only sends provided fields', async () => {
    await updateUserPreferences('u-1', { userContext: 'only this' });
    expect(mockUpsert).toHaveBeenCalledWith(
      { user_id: 'u-1', user_context: 'only this' },
      { onConflict: 'user_id' },
    );
  });

  it('throws on supabase error', async () => {
    mockUpsert.mockResolvedValue({ error: { message: 'oops' } });
    await expect(
      updateUserPreferences('u-1', { userContext: 'x' }),
    ).rejects.toThrow(/oops/);
  });
});
