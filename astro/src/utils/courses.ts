import { getCollection } from 'astro:content';
import { isDraftModeEnabled } from '~/utils/utils';

export const fetchCourses = async (locale: 'en' | 'da') =>
  getCollection('course', ({ id, data }) => id.startsWith(`${locale}/`) && (isDraftModeEnabled() || !data.draft));
