import type { ProjectStatus } from '~/types';
import { parseCsvParamValues, parseSingleEnumParam, withUpdatedFilterSearchParams } from './query-state.ts';

export const PROJECT_STATUSES: ProjectStatus[] = ['mature', 'beta', 'lab', 'explore', 'not-started'];
export const PROJECT_STATUS_SET = new Set<ProjectStatus>(PROJECT_STATUSES);

export interface ProjectFilters {
  status?: ProjectStatus;
  tags: string[];
}

type ProjectLike = {
  project: {
    status: string;
    tags?: Array<{ slug: string }>;
  };
};

export const parseProjectFilters = (searchParams: URLSearchParams): ProjectFilters => {
  const status = parseSingleEnumParam(searchParams.getAll('status'), PROJECT_STATUS_SET);
  const tags = parseCsvParamValues(searchParams.getAll('tags'));

  return { status, tags };
};

export const serializeProjectFilters = ({
  existingSearchParams,
  filters,
}: {
  existingSearchParams: URLSearchParams;
  filters: ProjectFilters;
}): URLSearchParams =>
  withUpdatedFilterSearchParams({
    existing: existingSearchParams,
    managedKeys: ['status', 'tags'],
    next: {
      status: filters.status,
      tags: filters.tags.length > 0 ? filters.tags.join(',') : undefined,
    },
  });

export const matchesProjectFilters = (project: ProjectLike, filters: ProjectFilters): boolean => {
  if (filters.status && project.project.status !== filters.status) {
    return false;
  }

  if (filters.tags.length === 0) {
    return true;
  }

  const projectTags = new Set((project.project.tags ?? []).map((tag) => tag.slug.toLowerCase()));
  return filters.tags.some((tag) => projectTags.has(tag));
};

export const filterProjects = <T extends ProjectLike>(projects: T[], filters: ProjectFilters): T[] =>
  projects.filter((project) => matchesProjectFilters(project, filters));
