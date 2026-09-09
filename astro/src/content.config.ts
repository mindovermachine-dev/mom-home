import { defineCollection, reference } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import {
  hasDuplicateParticipantIds,
  isSafeProjectReferenceUrl,
  isValidProjectRepository,
} from '~/utils/project-validation';

const PROJECT_STATUSES = ['mature', 'beta', 'lab', 'explore', 'not-started'] as const;

const projectParticipantsSchema = z
  .object({
    leads: z.array(reference('profile')).optional(),
    contributors: z.array(reference('profile')).optional(),
  })
  .optional()
  .superRefine((participants, context) => {
    if (!participants) return;

    const leads = participants.leads?.map((lead) => lead.id) ?? [];
    const contributors = participants.contributors?.map((contributor) => contributor.id) ?? [];
    contributors.forEach((contributorId, index) => {
      if (hasDuplicateParticipantIds(leads, [contributorId])) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate participant '${contributorId}' is not allowed in both leads and contributors.`,
          path: ['contributors', index],
        });
      }
    });
  });

const metadataDefinition = () =>
  z
    .object({
      title: z.string().optional(),
      ignoreTitleTemplate: z.boolean().optional(),

      canonical: z.url().optional(),

      robots: z
        .object({
          index: z.boolean().optional(),
          follow: z.boolean().optional(),
        })
        .optional(),

      description: z.string().optional(),

      openGraph: z
        .object({
          url: z.string().optional(),
          siteName: z.string().optional(),
          images: z
            .array(
              z.object({
                url: z.string(),
                width: z.number().optional(),
                height: z.number().optional(),
              })
            )
            .optional(),
          locale: z.string().optional(),
          type: z.string().optional(),
        })
        .optional(),

      twitter: z
        .object({
          handle: z.string().optional(),
          site: z.string().optional(),
          cardType: z.string().optional(),
        })
        .optional(),
    })
    .optional();

const postCollection = defineCollection({
  loader: glob({ pattern: ['**/*.md', '**/*.mdx'], base: 'src/data/post' }),
  schema: z.object({
    publishDate: z.date().optional(),
    updateDate: z.date().optional(),
    draft: z.boolean().optional(),

    title: z.string(),
    excerpt: z.string().optional(),
    image: z.string().optional(),

    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    author: z.string().optional(),
    coauthor: z.string().optional(),
    reviewers: z.array(z.string()).optional(),

    metadata: metadataDefinition(),
  }),
});

const profileCollection = defineCollection({
  loader: glob({ pattern: ['**/*.md', '**/*.mdx'], base: 'src/data/profile' }),
  schema: z.object({
    name: z.string(),
    bio: z.string(),
    image: z.string(),
    github: z.string(),
    linkedin: z.string().optional(),
    website: z.string().optional(),
  }),
});

const eventCollection = defineCollection({
  loader: glob({ pattern: ['**/*.md', '**/*.mdx'], base: 'src/data/event' }),
  schema: z.object({
    title: z.string(),
    sortorder: z.number().int().optional(),
    dates: z
      .array(
        z.object({
          date: z.union([z.date(), z.string().min(1)]),
          time: z.string().optional(),
          duration: z.string().optional(),
        })
      )
      .min(1),
    location: z.union([
      z.string(),
      z.object({
        venue: z.string().optional(),
        address: z.string().optional(),
        mapurl: z.string().optional(),
      }),
    ]),
    excerpt: z.string().optional(),
    image: z.string().optional(),
    signup: z
      .object({
        signupurl: z.string(),
        embeddedTallyURL: z.string().url().optional(),
        caption: z.string().optional(),
        icon: z.string().optional(),
        repeat: z.boolean().optional(),
      })
      .optional(),
    draft: z.boolean().optional(),
    metadata: metadataDefinition(),
  }),
});

const serviceCollection = defineCollection({
  loader: glob({ pattern: ['**/*.md', '**/*.mdx'], base: 'src/data/service' }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string().optional(),
    image: z.string().optional(),
    cta: z
      .object({
        ctaurl: z.string(),
        caption: z.string().optional(),
        icon: z.string().optional(),
        repeat: z.boolean().optional(),
      })
      .optional(),
    order: z.number().int().optional(),
    draft: z.boolean().optional(),
    metadata: metadataDefinition(),
  }),
});

const projectCollection = defineCollection({
  loader: glob({ pattern: ['**/*.md', '**/*.mdx'], base: 'src/data/project' }),
  schema: z.object({
    publishDate: z.date(),
    updateDate: z.date().optional(),
    draft: z.boolean().optional(),
    title: z.string(),
    excerpt: z.string().optional(),
    image: z.string().optional(),
    tags: z.array(z.string()).optional(),
    metadata: metadataDefinition(),
    project: z.object({
      status: z.enum(PROJECT_STATUSES),
      order: z.number().int().optional(),
      tags: z.array(z.string()).optional(),
      slack: z
        .object({
          channel: z.string().trim().min(1).optional(),
          url: z.url().optional(),
        })
        .optional(),
      github: z
        .object({
          repositories: z.array(z.string().trim().min(1).refine(isValidProjectRepository, 'Use owner/name format')),
        })
        .optional(),
      references: z
        .array(
          z.object({
            name: z.string().trim().min(1),
            url: z.string().trim().refine(isSafeProjectReferenceUrl, {
              message: 'Use a site-relative path or an absolute http/https URL',
            }),
          })
        )
        .optional(),
      participants: projectParticipantsSchema,
    }),
  }),
});

export const collections = {
  post: postCollection,
  profile: profileCollection,
  event: eventCollection,
  service: serviceCollection,
  project: projectCollection,
};
