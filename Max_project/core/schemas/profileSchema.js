export const profileSchema = {
  required: [
    "age",
    "occupation",
    "schedule",
    "goals",
    "preferences",
    "constraints",
    "personality"
  ],
  optional: [
    "physicalBaseline",
    "financialBaseline",
    "habits",
    "progressHistory"
  ]
};

export function validateProfile(profile) {
  const missing = profileSchema.required.filter((field) => {
    const value = profile[field];
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    if (value && typeof value === "object") {
      if (field === "goals") {
        return !value.primaryGoal || !Array.isArray(value.focusDomains);
      }
      return Object.keys(value).length === 0;
    }
    return value === undefined || value === null || value === "";
  });

  return {
    valid: missing.length === 0,
    missing
  };
}
