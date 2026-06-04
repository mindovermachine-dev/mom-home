import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { Profile, ProfileRelation, ProfileRelationRole, Post } from '~/types';
import { fetchPosts } from '~/utils/blog';

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

export const getProfileWithRelations = async (
  id: string
): Promise<{ id: string; profile?: Profile; relations: Array<ProfileRelation> }> => {
  const [profile, posts] = await Promise.all([findProfileById(id), fetchPosts()]);
  const relationsByProfile = buildProfileRelationsFromPosts(posts);

  return {
    id,
    profile,
    relations: relationsByProfile[id] || [],
  };
};
