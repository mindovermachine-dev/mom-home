import test from 'node:test';
import assert from 'node:assert/strict';
import { getExternalLinkAttrs, isExternalUrl } from './external-links.ts';

test('HTTP(S) URLs open in a new tab, including links to this site', () => {
  for (const url of ['https://www.mindovermachine.dk/', 'http://example.com/', 'HTTPS://example.com/']) {
    assert.equal(isExternalUrl(url), true);
    assert.deepEqual(getExternalLinkAttrs(url), { target: '_blank', rel: 'noopener noreferrer' });
  }
});

test('relative and non-HTTP URLs stay in the current tab', () => {
  for (const url of ['/', '/events/', '#section', 'mailto:info@example.com', '//example.com/', '', undefined, null]) {
    assert.equal(isExternalUrl(url), false);
    assert.deepEqual(getExternalLinkAttrs(url), {});
  }
});
