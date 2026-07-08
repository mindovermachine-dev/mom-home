import { getCollection, render } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { Service } from '~/types';
import { cleanSlug } from '~/utils/permalinks';
import { isDraftModeEnabled } from '~/utils/utils';

type ServiceLocale = 'en' | 'da';
const SUPPORTED_SERVICE_LOCALES = new Set<ServiceLocale>(['en', 'da']);

const getServiceLocaleAndId = (id: string): { locale: ServiceLocale; localizedId: string } => {
  const [first, ...rest] = id.split('/');

  if (first && SUPPORTED_SERVICE_LOCALES.has(first as ServiceLocale) && rest.length) {
    return { locale: first as ServiceLocale, localizedId: rest.join('/') };
  }

  return { locale: 'en', localizedId: id };
};

const getLocalizedServices = (
  services: Array<Service>,
  { locale = 'en', fallbackLocale }: { locale?: ServiceLocale; fallbackLocale?: ServiceLocale } = {}
): Array<Service> => {
  if (!fallbackLocale || fallbackLocale === locale) {
    return services.filter((service) => service.locale === locale);
  }

  const localizedSlugs = new Set(
    services.filter((service) => service.locale === locale).map((service) => service.slug)
  );

  return services.filter(
    (service) => service.locale === locale || (service.locale === fallbackLocale && !localizedSlugs.has(service.slug))
  );
};

const getNormalizedService = async (service: CollectionEntry<'service'>): Promise<Service> => {
  const { id, data } = service;
  const { locale, localizedId } = getServiceLocaleAndId(id);
  const { Content } = await render(service);

  return {
    id,
    locale,
    slug: cleanSlug(localizedId),
    title: data.title,
    excerpt: data.excerpt,
    image: data.image,
    cta: data.cta,
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

export const fetchServices = async ({
  locale,
  fallbackLocale,
}: { locale?: ServiceLocale; fallbackLocale?: ServiceLocale } = {}): Promise<Array<Service>> => {
  if (!_services) {
    _services = await load();
  }

  return getLocalizedServices(_services, { locale, fallbackLocale });
};

export const findServiceBySlug = async (slug: string): Promise<Service | undefined> => {
  const normalizedSlug = cleanSlug(slug);
  return (await fetchServices()).find((service) => service.slug === normalizedSlug);
};

export const findLocalizedServiceWithFallback = async ({
  slug,
  locale = 'en',
  fallbackLocale = 'en',
}: {
  slug: string;
  locale?: ServiceLocale;
  fallbackLocale?: ServiceLocale;
}): Promise<{ service: Service | undefined; usedLocale: ServiceLocale | undefined }> => {
  const normalizedSlug = cleanSlug(slug);
  const primaryService = (await fetchServices({ locale })).find((service) => service.slug === normalizedSlug);

  if (primaryService) {
    return { service: primaryService, usedLocale: locale };
  }

  if (fallbackLocale !== locale) {
    const fallbackService = (await fetchServices({ locale: fallbackLocale })).find(
      (service) => service.slug === normalizedSlug
    );

    if (fallbackService) {
      return { service: fallbackService, usedLocale: fallbackLocale };
    }
  }

  return { service: undefined, usedLocale: undefined };
};
