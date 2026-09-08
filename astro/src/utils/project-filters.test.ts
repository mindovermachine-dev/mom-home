import test from 'node:test';
import assert from 'node:assert/strict';
import { filterProjects, parseProjectFilters, serializeProjectFilters } from './project-filters.ts';

const projects = [
  {
    project: {
      status: 'mature',
      tags: [
        { slug: 'ai', title: 'AI' },
        { slug: 'devx', title: 'DevX' },
      ],
    },
  },
  {
    project: {
      status: 'not-started',
      tags: [{ slug: 'internship', title: 'Internship' }],
    },
  },
] as any;

test('parseProjectFilters handles invalid and repeated values', () => {
  const filters = parseProjectFilters(
    new URLSearchParams('status=invalid&status=beta&tags=AI,internship&tags=devx%2Cdevx')
  );

  assert.equal(filters.status, 'beta');
  assert.deepEqual(filters.tags, ['ai', 'internship', 'devx']);
});

test('serializeProjectFilters preserves unrelated parameters', () => {
  const params = serializeProjectFilters({
    existingSearchParams: new URLSearchParams('utm_source=test&status=beta'),
    filters: { status: undefined, tags: ['ai'] },
  });

  assert.equal(params.get('utm_source'), 'test');
  assert.equal(params.get('status'), null);
  assert.equal(params.get('tags'), 'ai');
});

test('filterProjects applies status and OR tag matching', () => {
  const filtered = filterProjects(projects, { status: 'mature', tags: ['internship', 'devx'] });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].project.status, 'mature');
});
