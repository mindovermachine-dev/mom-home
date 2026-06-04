import { getCollection, render } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { Event } from '~/types';
import { cleanSlug } from '~/utils/permalinks';

const getNormalizedEvent = async (event: CollectionEntry<'event'>): Promise<Event> => {
  const { id, data } = event;
  const { Content } = await render(event);
  const dates = (data.dates ?? [])
    .map((occurrence) => ({
      date: new Date(occurrence.date),
      duration: occurrence.duration,
    }))
    .sort((a, b) => a.date.valueOf() - b.date.valueOf());

  const fallbackDate = data.eventDate ? new Date(data.eventDate) : dates[0]?.date;

  if (!fallbackDate) {
    throw new Error(`Event "${id}" is missing both eventDate and dates`);
  }

  return {
    id,
    slug: cleanSlug(id),
    title: data.title,
    eventDate: fallbackDate,
    endDate: data.endDate && dates.length === 0 ? new Date(data.endDate) : undefined,
    dates: dates.length > 0 ? dates : [{ date: fallbackDate }],
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
    .sort((a, b) => a.eventDate.valueOf() - b.eventDate.valueOf())
    .filter((event) => !event.draft);
};

let _events: Array<Event>;

export const fetchEvents = async (): Promise<Array<Event>> => {
  if (!_events) {
    _events = await load();
  }

  return _events;
};

export const findEventBySlug = async (slug: string): Promise<Event | undefined> => {
  const normalizedSlug = cleanSlug(slug);
  return (await fetchEvents()).find((event) => event.slug === normalizedSlug);
};
