import { getCollection, render } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { APP_EVENTS } from 'astrowind:config';
import type { Event } from '~/types';
import { cleanSlug } from '~/utils/permalinks';
import { isDraftModeEnabled } from '~/utils/utils';

type EventLocale = 'en' | 'da';
const SUPPORTED_EVENT_LOCALES = new Set<EventLocale>(['en', 'da']);

const getEventLocaleAndId = (id: string): { locale: EventLocale; localizedId: string } => {
  const [first, ...rest] = id.split('/');

  if (first && SUPPORTED_EVENT_LOCALES.has(first as EventLocale) && rest.length) {
    return { locale: first as EventLocale, localizedId: rest.join('/') };
  }

  return { locale: 'en', localizedId: id };
};

const getLocalizedEvents = (
  events: Array<Event>,
  { locale = 'en', fallbackLocale }: { locale?: EventLocale; fallbackLocale?: EventLocale } = {}
): Array<Event> => {
  if (!fallbackLocale || fallbackLocale === locale) {
    return events.filter((event) => event.locale === locale);
  }

  const localizedSlugs = new Set(events.filter((event) => event.locale === locale).map((event) => event.slug));

  return events.filter(
    (event) => event.locale === locale || (event.locale === fallbackLocale && !localizedSlugs.has(event.slug))
  );
};

const toNormalizedDate = (rawDate: Date | string): Date | string => {
  if (rawDate instanceof Date) {
    return rawDate;
  }

  const parsed = new Date(rawDate);
  return Number.isNaN(parsed.getTime()) ? rawDate : parsed;
};

const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)(?:\s*(CET|CEST|UTC|GMT|Z|[+-]\d{1,2}(?::?\d{2})?))?$/i;

export const getDurationMs = (duration?: string): number => {
  if (!duration) return 0;
  const str = duration.trim().toLowerCase();

  // Pattern: "2:30h", "2:30", "01:00h"
  const colonMatch = /^(\d+):([0-5]\d)(?:\s*h(?:ours?|rs?)?)?$/i.exec(str);
  if (colonMatch) {
    const hours = Number(colonMatch[1]);
    const minutes = Number(colonMatch[2]);
    return (hours * 60 + minutes) * 60 * 1000;
  }

  // Pattern: "1h 30m", "1h30m", "1 hour 30 mins"
  const combinedMatch =
    /^(\d+(?:\.\d+)?)\s*(?:h|hours?|hrs?)\s*(?:and\s*)?(\d+(?:\.\d+)?)\s*(?:m|mins?|minutes?)$/i.exec(str);
  if (combinedMatch) {
    const hours = Number(combinedMatch[1]);
    const minutes = Number(combinedMatch[2]);
    return (hours * 60 + minutes) * 60 * 1000;
  }

  // Pattern: "3 hours", "2.5h", "1 hr", "2 hrs"
  const hoursMatch = /^(\d+(?:\.\d+)?)\s*(?:h|hours?|hrs?)$/i.exec(str);
  if (hoursMatch) {
    return Number(hoursMatch[1]) * 60 * 60 * 1000;
  }

  // Pattern: "30 mins", "45 minutes", "90m", "15 min"
  const minsMatch = /^(\d+(?:\.\d+)?)\s*(?:m|mins?|minutes?)$/i.exec(str);
  if (minsMatch) {
    return Number(minsMatch[1]) * 60 * 1000;
  }

  return 0;
};

const getZonedUtcTimestamp = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone = 'Europe/Copenhagen'
): number => {
  const d = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });
  const parts = formatter.formatToParts(d);
  const p: Record<string, string> = {};
  for (const part of parts) {
    p[part.type] = part.value;
  }
  const tzHour = parseInt(p.hour, 10) === 24 ? 0 : parseInt(p.hour, 10);
  const asIfUtc = Date.UTC(
    parseInt(p.year, 10),
    parseInt(p.month, 10) - 1,
    parseInt(p.day, 10),
    tzHour,
    parseInt(p.minute, 10),
    parseInt(p.second, 10)
  );
  const offset = asIfUtc - d.getTime();
  return d.getTime() - offset;
};

export const getOccurrenceStartTimestampOrInfinity = (occurrence: { date: Date | string; time?: string }): number => {
  if (!(occurrence.date instanceof Date)) {
    return Number.POSITIVE_INFINITY;
  }

  const year = occurrence.date.getUTCFullYear();
  const month = occurrence.date.getUTCMonth() + 1;
  const day = occurrence.date.getUTCDate();

  if (!occurrence.time) {
    return getZonedUtcTimestamp(year, month, day, 0, 0);
  }

  const match = TIME_PATTERN.exec(occurrence.time.trim());
  if (!match) {
    return getZonedUtcTimestamp(year, month, day, 0, 0);
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const tzSpec = match[3]?.toUpperCase();

  if (tzSpec === 'UTC' || tzSpec === 'GMT' || tzSpec === 'Z') {
    return Date.UTC(year, month - 1, day, hours, minutes);
  }

  if (tzSpec && (tzSpec.startsWith('+') || tzSpec.startsWith('-'))) {
    const sign = tzSpec[0] === '+' ? 1 : -1;
    const cleanTz = tzSpec.slice(1).replace(':', '');
    const offsetMinutes =
      cleanTz.length <= 2 ? Number(cleanTz) * 60 : Number(cleanTz.slice(0, 2)) * 60 + Number(cleanTz.slice(2));
    return Date.UTC(year, month - 1, day, hours, minutes) - sign * offsetMinutes * 60 * 1000;
  }

  return getZonedUtcTimestamp(year, month, day, hours, minutes, 'Europe/Copenhagen');
};

export const getOccurrenceTimestampOrInfinity = getOccurrenceStartTimestampOrInfinity;

export const getOccurrenceEndTimestampOrInfinity = (occurrence: {
  date: Date | string;
  time?: string;
  duration?: string;
}): number => {
  if (!(occurrence.date instanceof Date)) {
    return Number.POSITIVE_INFINITY;
  }

  const startTimestamp = getOccurrenceStartTimestampOrInfinity(occurrence);
  const durationMs = getDurationMs(occurrence.duration);

  if (durationMs > 0) {
    return startTimestamp + durationMs;
  }

  if (!occurrence.time) {
    const year = occurrence.date.getUTCFullYear();
    const month = occurrence.date.getUTCMonth() + 1;
    const day = occurrence.date.getUTCDate();
    return getZonedUtcTimestamp(year, month, day, 23, 59) + 59 * 1000 + 999;
  }

  return startTimestamp;
};

const getNormalizedEvent = async (event: CollectionEntry<'event'>): Promise<Event> => {
  const { id, data } = event;
  const { locale, localizedId } = getEventLocaleAndId(id);
  const { Content } = await render(event);
  const dates = data.dates
    .map((occurrence) => ({
      date: toNormalizedDate(occurrence.date),
      time: occurrence.time,
      duration: occurrence.duration,
    }))
    .sort((a, b) => getOccurrenceTimestampOrInfinity(a) - getOccurrenceTimestampOrInfinity(b));

  return {
    id,
    locale,
    slug: cleanSlug(localizedId),
    title: data.title,
    sortorder: data.sortorder,
    dates,
    location: data.location,
    excerpt: data.excerpt,
    image: data.image,
    signup: data.signup,
    metadata: data.metadata,
    draft: data.draft,
    Content,
  };
};

const load = async (): Promise<Array<Event>> => {
  const events = await getCollection('event');
  const normalizedEvents = events.map(async (event) => await getNormalizedEvent(event));

  return (await Promise.all(normalizedEvents))
    .sort((a, b) => {
      const aTimestamp = getOccurrenceTimestampOrInfinity(a.dates[0]);
      const bTimestamp = getOccurrenceTimestampOrInfinity(b.dates[0]);

      if (aTimestamp !== bTimestamp) {
        return aTimestamp - bTimestamp;
      }

      if (aTimestamp === Number.POSITIVE_INFINITY) {
        const aSortorder = a.sortorder ?? Number.POSITIVE_INFINITY;
        const bSortorder = b.sortorder ?? Number.POSITIVE_INFINITY;

        if (aSortorder !== bSortorder) {
          return aSortorder - bSortorder;
        }
      }

      return a.slug.localeCompare(b.slug);
    })
    .filter((event) => APP_EVENTS.showDrafts || isDraftModeEnabled() || !event.draft);
};

let _events: Array<Event>;

export const fetchEvents = async ({
  locale,
  fallbackLocale,
}: { locale?: EventLocale; fallbackLocale?: EventLocale } = {}): Promise<Array<Event>> => {
  if (!_events) {
    _events = await load();
  }

  if (!locale && !fallbackLocale) {
    return _events;
  }

  return getLocalizedEvents(_events, { locale, fallbackLocale });
};

export const findEventBySlug = async (slug: string): Promise<Event | undefined> => {
  const normalizedSlug = cleanSlug(slug);
  return (await fetchEvents()).find((event) => event.slug === normalizedSlug);
};

export const findLocalizedEventWithFallback = async ({
  slug,
  locale = 'en',
  fallbackLocale = 'en',
}: {
  slug: string;
  locale?: EventLocale;
  fallbackLocale?: EventLocale;
}): Promise<{ event: Event | undefined; usedLocale: EventLocale | undefined }> => {
  const normalizedSlug = cleanSlug(slug);
  const primaryEvent = (await fetchEvents({ locale })).find((event) => event.slug === normalizedSlug);

  if (primaryEvent) {
    return { event: primaryEvent, usedLocale: locale };
  }

  if (fallbackLocale !== locale) {
    const fallbackEvent = (await fetchEvents({ locale: fallbackLocale })).find(
      (event) => event.slug === normalizedSlug
    );

    if (fallbackEvent) {
      return { event: fallbackEvent, usedLocale: fallbackLocale };
    }
  }

  return { event: undefined, usedLocale: undefined };
};
