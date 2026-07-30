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

const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)(?:\s*(?:UTC|Z))?$/i;

const getTimeOffsetMs = (time?: string): number | undefined => {
  if (!time) return undefined;

  const match = TIME_PATTERN.exec(time.trim());
  if (!match) return undefined;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return (hours * 60 + minutes) * 60 * 1000;
};

export const getOccurrenceTimestampOrInfinity = (occurrence: { date: Date | string; time?: string }): number => {
  if (!(occurrence.date instanceof Date)) {
    return Number.POSITIVE_INFINITY;
  }

  const baseTimestamp = occurrence.date.getTime();
  const timeOffset = getTimeOffsetMs(occurrence.time);

  if (timeOffset == null) {
    return baseTimestamp;
  }

  const midnightUtc = Date.UTC(
    occurrence.date.getUTCFullYear(),
    occurrence.date.getUTCMonth(),
    occurrence.date.getUTCDate(),
    0,
    0,
    0,
    0
  );

  return midnightUtc + timeOffset;
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
