import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { Profile, ProfileRelation, ProfileRelationRole, Post, Project } from '~/types';
import { fetchPosts } from '~/utils/blog';
import { fetchProjects } from '~/utils/projects';

const getNormalizedProfile = (profile: CollectionEntry<'profile'>): Profile => {
  const { id, data } = profile;

  return {
    id,
    name: data.name,
    bio: data.bio,
    image: data.image,
    github: data.github,
    linkedin: data.linkedin,
    website: data.website,
  };
};

const load = async (): Promise<Array<Profile>> => {
  const profiles = await getCollection('profile');
  return profiles.map(getNormalizedProfile);
};

let _profiles: Array<Profile>;

export const fetchProfiles = async (): Promise<Array<Profile>> => {
  if (!_profiles) {
    _profiles = await load();
  }

  return _profiles;
};

export const findProfileById = async (id: string | undefined): Promise<Profile | undefined> => {
  if (!id) return undefined;

  return (await fetchProfiles()).find((profile) => profile.id === id);
};

const addRelation = (
  relationsByProfile: Record<string, Array<ProfileRelation>>,
  profileId: string | undefined,
  role: ProfileRelationRole,
  post: Pick<Post, 'id' | 'title' | 'permalink'>
) => {
  if (!profileId) return;

  if (!relationsByProfile[profileId]) {
    relationsByProfile[profileId] = [];
  }

  relationsByProfile[profileId].push({
    role,
    sourceType: 'post',
    sourceId: post.id,
    title: post.title,
    permalink: post.permalink,
  });
};

export const buildProfileRelationsFromPosts = (
  posts: Array<Pick<Post, 'id' | 'title' | 'permalink' | 'author' | 'coauthor' | 'reviewers'>>
): Record<string, Array<ProfileRelation>> =>
  posts.reduce<Record<string, Array<ProfileRelation>>>((relationsByProfile, post) => {
    addRelation(relationsByProfile, post.author, 'author', post);
    addRelation(relationsByProfile, post.coauthor, 'coauthor', post);
    post.reviewers?.forEach((reviewerId) => addRelation(relationsByProfile, reviewerId, 'reviewer', post));

    return relationsByProfile;
  }, {});

const addProjectRelation = (
  relationsByProfile: Record<string, Array<ProfileRelation>>,
  profileId: string | undefined,
  role: Extract<ProfileRelationRole, 'lead' | 'contributor'>,
  project: Pick<Project, 'id' | 'title' | 'permalink'>
) => {
  if (!profileId) return;

  if (!relationsByProfile[profileId]) {
    relationsByProfile[profileId] = [];
  }

  relationsByProfile[profileId].push({
    role,
    sourceType: 'project',
    sourceId: project.id,
    title: project.title,
    permalink: project.permalink,
  });
};

export const buildProfileRelationsFromProjects = (
  projects: Array<Pick<Project, 'id' | 'title' | 'permalink' | 'project'>>
): Record<string, Array<ProfileRelation>> =>
  projects.reduce<Record<string, Array<ProfileRelation>>>((relationsByProfile, project) => {
    project.project.participants?.leads?.forEach((leadId) =>
      addProjectRelation(relationsByProfile, leadId, 'lead', project)
    );
    project.project.participants?.contributors?.forEach((contributorId) =>
      addProjectRelation(relationsByProfile, contributorId, 'contributor', project)
    );

    return relationsByProfile;
  }, {});

export const getProfileWithRelations = async (
  id: string
): Promise<{ id: string; profile?: Profile; relations: Array<ProfileRelation> }> => {
  const [profile, posts, projects] = await Promise.all([findProfileById(id), fetchPosts(), fetchProjects()]);
  const relationsByProfile = buildProfileRelationsFromPosts(posts);
  const projectRelationsByProfile = buildProfileRelationsFromProjects(projects);
  const relations = [...(relationsByProfile[id] || []), ...(projectRelationsByProfile[id] || [])];

  return {
    id,
    profile,
    relations,
  };
};
