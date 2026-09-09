import test from 'node:test';
import assert from 'node:assert/strict';
import { getProjectPageMetadata } from './project-metadata.ts';

test('project page metadata prefers excerpt over metadata.description', () => {
  const metadata = getProjectPageMetadata(
    {
      title: 'Takt Community Lab',
      excerpt: 'Shared project space for evolving Takt.',
      metadata: {
        description: 'Outdated duplicate description',
      },
      project: {
        status: 'mature',
      },
    } as any,
    'https://example.com/projects/takt/'
  );

  assert.equal(metadata.description, 'Shared project space for evolving Takt.');
});

test('project page metadata falls back to metadata.description when excerpt is absent', () => {
  const metadata = getProjectPageMetadata(
    {
      title: 'Takt Community Lab',
      metadata: {
        description: 'Fallback description',
      },
      project: {
        status: 'mature',
      },
    } as any,
    'https://example.com/projects/takt/'
  );

  assert.equal(metadata.description, 'Fallback description');
});
