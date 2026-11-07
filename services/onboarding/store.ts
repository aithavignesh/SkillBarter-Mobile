import { OnboardingInput } from "@/types";

let draftOnboarding: OnboardingInput = {
  displayName: "",
  bio: "",
  location: "",
  preferredSessionFormat: "video",
  availability: "Flexible",
  offeredSkills: [],
  wantedSkills: [],
};

export const onboardingStore = {
  getDraft(): OnboardingInput {
    return { ...draftOnboarding };
  },
  updateDraft(partial: Partial<OnboardingInput>) {
    draftOnboarding = { ...draftOnboarding, ...partial };
  },
  reset() {
    draftOnboarding = {
      displayName: "",
      bio: "",
      location: "",
      preferredSessionFormat: "video",
      availability: "Flexible",
      offeredSkills: [],
      wantedSkills: [],
    };
  },
};
