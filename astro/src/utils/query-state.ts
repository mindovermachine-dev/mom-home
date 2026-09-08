export const getNormalizedQueryValue = (value: string) => value.trim().toLowerCase();

export const parseCsvParamValues = (values: string[]): string[] => {
  const seen = new Set<string>();
  const parsed: string[] = [];

  values
    .flatMap((value) => value.split(','))
    .map((value) => getNormalizedQueryValue(value))
    .filter(Boolean)
    .forEach((value) => {
      if (!seen.has(value)) {
        seen.add(value);
        parsed.push(value);
      }
    });

  return parsed;
};

export const parseSingleEnumParam = <T extends string>(values: string[], allowed: ReadonlySet<T>): T | undefined => {
  for (const value of values) {
    const normalized = getNormalizedQueryValue(value);
    if (allowed.has(normalized as T)) {
      return normalized as T;
    }
  }

  return undefined;
};

export const withUpdatedFilterSearchParams = ({
  existing,
  next,
  managedKeys,
}: {
  existing: URLSearchParams;
  next: Record<string, string | undefined>;
  managedKeys: string[];
}): URLSearchParams => {
  const updated = new URLSearchParams(existing.toString());

  managedKeys.forEach((key) => updated.delete(key));

  Object.entries(next).forEach(([key, value]) => {
    if (!value) return;
    updated.set(key, value);
  });

  return updated;
};
