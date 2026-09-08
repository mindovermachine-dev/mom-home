export const isValidProjectRepository = (value: string) => /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value.trim());

export const isSafeProjectReferenceUrl = (value: string) => /^\/[^\s]*$/.test(value) || /^https?:\/\/\S+$/i.test(value);

export const hasDuplicateParticipantIds = (leads: string[] = [], contributors: string[] = []): boolean => {
  const leadSet = new Set(leads);
  return contributors.some((contributorId) => leadSet.has(contributorId));
};
