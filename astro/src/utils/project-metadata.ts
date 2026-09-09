import merge from 'lodash.merge';
import type { MetaData, Project } from '~/types';

export const getProjectPageMetadata = (project: Project, canonical: string): MetaData => {
  const metadata = merge(
    {
      title: project.title,
      canonical,
      openGraph: project.image
        ? {
            images: [
              {
                url: typeof project.image === 'string' ? project.image : project.image.src,
              },
            ],
          }
        : undefined,
    },
    { ...(project.metadata ? { ...project.metadata, canonical: project.metadata?.canonical || canonical } : {}) }
  ) as MetaData;

  metadata.description = project.excerpt ?? project.metadata?.description;
  return metadata;
};
