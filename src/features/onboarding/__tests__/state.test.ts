import { useOnboardingStore } from '../state';

beforeEach(() => {
  useOnboardingStore.getState().reset();
});

describe('useOnboardingStore', () => {
  it('starts with default empty values', () => {
    const { data } = useOnboardingStore.getState();
    expect(data.persona).toBeNull();
    expect(data.painPoints).toEqual([]);
    expect(data.hardConstraints).toEqual([]);
    expect(data.sleepTime).toBe('23:00');
    expect(data.wakeUpTime).toBe('07:00');
    expect(data.productivityPeak).toBeNull();
    expect(data.schedulingContext).toBe('');
  });

  it('setField updates a field', () => {
    useOnboardingStore.getState().setField('persona', 'student');
    expect(useOnboardingStore.getState().data.persona).toBe('student');
  });

  it('setField preserves other fields', () => {
    useOnboardingStore.getState().setField('persona', 'professional');
    useOnboardingStore.getState().setField('schedulingContext', 'test note');
    const { data } = useOnboardingStore.getState();
    expect(data.persona).toBe('professional');
    expect(data.schedulingContext).toBe('test note');
    expect(data.painPoints).toEqual([]);
  });

  it('reset returns to defaults', () => {
    useOnboardingStore.getState().setField('persona', 'parent');
    useOnboardingStore.getState().setField('schedulingContext', 'some context');
    useOnboardingStore.getState().reset();
    const { data } = useOnboardingStore.getState();
    expect(data.persona).toBeNull();
    expect(data.schedulingContext).toBe('');
  });
});
