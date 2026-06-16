import { create } from 'zustand';
import type { OnboardingData } from '@/types/onboarding';

const EMPTY_ONBOARDING_DATA: OnboardingData = {
  persona: null,
  painPoints: [],
  sleepTime: null,
  wakeUpTime: null,
  productivityPeak: null,
  hardConstraints: [],
  schedulingContext: '',
};

type OnboardingState = {
  data: OnboardingData;
  setField: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void;
  reset: () => void;
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  data: { ...EMPTY_ONBOARDING_DATA },
  setField: (key, value) =>
    set((state) => ({ data: { ...state.data, [key]: value } })),
  reset: () => set({ data: { ...EMPTY_ONBOARDING_DATA } }),
}));
