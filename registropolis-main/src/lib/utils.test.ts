import assert from 'node:assert/strict';
import test from 'node:test';
import { listingDetailPath, normalizeListingSection } from './utils';

test('normalizes singular listing section names', () => {
  assert.equal(normalizeListingSection('job'), 'jobs');
  assert.equal(normalizeListingSection('service'), 'services');
  assert.equal(normalizeListingSection('event'), 'events');
});

test('preserves canonical and unknown listing section names', () => {
  assert.equal(normalizeListingSection('marketplace'), 'marketplace');
  assert.equal(normalizeListingSection('real-estate'), 'real-estate');
  assert.equal(normalizeListingSection('custom'), 'custom');
});

test('listing detail paths use canonical sections', () => {
  assert.match(listingDetailPath('job', '42', { title: 'Engineer' }), /^\/dashboard\/jobs\/42\?d=/);
});