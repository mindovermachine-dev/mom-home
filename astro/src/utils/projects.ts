import { getCollection, render } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { Project, Taxonomy } from '~/types';
import { cleanSlug } from '~/utils/permalinks';
import { isDraftModeEnabled } from '~/utils/utils';

type ProjectLocale = 'en' | 'da';
const SUPPORTED_PROJECT_LOCALES = new Set<ProjectLocale>(['en', 'da']);

const getProjectLocaleAndId = (id: string): { locale: ProjectLocale; localizedId: string } => {
  const [first, ...rest] = id.split('/');

  if (first && SUPPORTED_PROJECT_LOCALES.has(first as ProjectLocale) && rest.length) {
    return { locale: first as ProjectLocale, localizedId: rest.join('/') };
  }

  return { locale: 'en', localizedId: id };
};

const getLocalizedProjects = (
  projects: Array<Project>,
  { locale = 'en', fallbackLocale }: { locale?: ProjectLocale; fallbackLocale?: ProjectLocale } = {}
): Array<Project> => {
  if (!fallbackLocale || fallbackLocale === locale) {
    return projects.filter((project) => project.locale === locale);
  }

  const localizedSlugs = new Set(
    projects.filter((project) => project.locale === locale).map((project) => project.slug)
  );

  return projects.filter(
    (project) => project.locale === locale || (project.locale === fallbackLocale && !localizedSlugs.has(project.slug))
  );
};

const getTaxonomy = (tags: string[] | undefined): Taxonomy[] =>
  (tags ?? []).map((tag) => ({
    slug: cleanSlug(tag),
    title: tag,
  }));

const getNormalizedProject = async (project: CollectionEntry<'project'>): Promise<Project> => {
  const { id, data } = project;
  const { locale, localizedId } = getProjectLocaleAndId(id);
  const { Content } = await render(project);

  return {
    id,
    locale,
    slug: cleanSlug(localizedId),
    permalink: locale === 'da' ? `da/projects/${cleanSlug(localizedId)}` : `projects/${cleanSlug(localizedId)}`,
    publishDate: new Date(data.publishDate),
    updateDate: data.updateDate ? new Date(data.updateDate) : undefined,
    title: data.title,
    excerpt: data.excerpt,
    image: data.image,
    tags: getTaxonomy(data.tags),
    metadata: data.metadata,
    draft: data.draft,
    project: {
      status: data.project.status,
      order: data.project.order,
      tags: getTaxonomy(data.project.tags),
      slack: data.project.slack,
      github: data.project.github,
      references: data.project.references,
      participants: data.project.participants
        ? {
            leads: data.project.participants.leads?.map((lead) => lead.id),
            contributors: data.project.participants.contributors?.map((contributor) => contributor.id),
          }
        : undefined,
    },
    Content,
  };
};

const load = async (): Promise<Array<Project>> => {
  const projects = await getCollection('project');
  const normalizedProjects = projects.map(async (project) => await getNormalizedProject(project));

  return (await Promise.all(normalizedProjects))
    .sort((a, b) => {
      const aOrder = a.project.order ?? Number.POSITIVE_INFINITY;
      const bOrder = b.project.order ?? Number.POSITIVE_INFINITY;

      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      const publishDateSort = b.publishDate.valueOf() - a.publishDate.valueOf();
      if (publishDateSort !== 0) {
        return publishDateSort;
      }

      return a.slug.localeCompare(b.slug);
    })
    .filter((project) => isDraftModeEnabled() || !project.draft);
};

let _projects: Array<Project>;

export const fetchProjects = async ({
  locale,
  fallbackLocale,
}: { locale?: ProjectLocale; fallbackLocale?: ProjectLocale } = {}): Promise<Array<Project>> => {
  if (!_projects) {
    _projects = await load();
  }

  if (!locale && !fallbackLocale) {
    return _projects;
  }

  return getLocalizedProjects(_projects, { locale, fallbackLocale });
};

export const findLocalizedProjectBySlug = async ({
  slug,
  locale = 'en',
}: {
  slug: string;
  locale?: ProjectLocale;
}): Promise<Project | undefined> => {
  const normalizedSlug = cleanSlug(slug);
  return (await fetchProjects({ locale })).find((project) => project.slug === normalizedSlug);
};
