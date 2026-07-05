const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);

const normalize = (value: string | undefined): string => (value ?? '').trim().toLowerCase();

export const isDraftModeEnabled = (): boolean => {
  if (import.meta.env.MODE === 'drafts') {
    return true;
  }

  return TRUE_VALUES.has(normalize(import.meta.env.INCLUDE_DRAFTS));
};
