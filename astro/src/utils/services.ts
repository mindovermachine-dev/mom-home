import { getCollection, render } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { Service } from '~/types';
import { cleanSlug } from '~/utils/permalinks';
import { isDraftModeEnabled } from '~/utils/utils';

const getNormalizedService = async (service: CollectionEntry<'service'>): Promise<Service> => {
  const { id, data } = service;
  const { Content } = await render(service);

  return {
    id,
    slug: cleanSlug(id),
    title: data.title,
    excerpt: data.excerpt,
    order: data.order,
    metadata: data.metadata,
    draft: data.draft,
    Content,
  };
};

const load = async (): Promise<Array<Service>> => {
  const services = await getCollection('service');
  const normalizedServices = services.map(async (service) => await getNormalizedService(service));

  return (await Promise.all(normalizedServices))
    .sort((a, b) => {
      const aOrder = a.order ?? Number.POSITIVE_INFINITY;
      const bOrder = b.order ?? Number.POSITIVE_INFINITY;

      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      return a.title.localeCompare(b.title);
    })
    .filter((service) => isDraftModeEnabled() || !service.draft);
};

let _services: Array<Service>;

export const fetchServices = async (): Promise<Array<Service>> => {
  if (!_services) {
    _services = await load();
  }

  return _services;
};

export const findServiceBySlug = async (slug: string): Promise<Service | undefined> => {
  const normalizedSlug = cleanSlug(slug);
  return (await fetchServices()).find((service) => service.slug === normalizedSlug);
};
