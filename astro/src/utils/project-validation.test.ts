import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hasDuplicateParticipantIds,
  isSafeProjectReferenceUrl,
  isValidProjectRepository,
} from './project-validation.ts';

test('repository validation requires owner/name syntax', () => {
  assert.equal(isValidProjectRepository('mindovermachine-dev/gh-tt'), true);
  assert.equal(isValidProjectRepository('mindovermachine-dev'), false);
  assert.equal(isValidProjectRepository('https://github.com/mindovermachine-dev/gh-tt'), false);
});

test('reference URL validation allows only relative or http/https URLs', () => {
  assert.equal(isSafeProjectReferenceUrl('/writings/takt/'), true);
  assert.equal(isSafeProjectReferenceUrl('https://mindovermachine.dev/takt/'), true);
  assert.equal(isSafeProjectReferenceUrl('javascript:alert(1)'), false);
});

test('duplicate participant IDs are detected across leads and contributors', () => {
  assert.equal(hasDuplicateParticipantIds(['lakruzz'], ['blikest']), false);
  assert.equal(hasDuplicateParticipantIds(['lakruzz'], ['lakruzz']), true);
});
