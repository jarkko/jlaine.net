'use strict';

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');

const { clusterCourtTotal } = require('../../source/beach-volleyball/map-view.js');

describe('clusterCourtTotal', () => {
  function fakeCluster(markers) {
    return {
      getAllChildMarkers: () => markers,
    };
  }

  function marker(courts) {
    return { options: { _courts: courts } };
  }

  test('sums _courts across all child markers when all are known', () => {
    const cluster = fakeCluster([marker(3), marker(2), marker(5)]);
    assert.equal(clusterCourtTotal(cluster), 10);
  });

  test('mixed known and unknown markers count unknowns as one venue', () => {
    const cluster = fakeCluster([marker(3), { options: {} }, marker(2)]);
    assert.equal(clusterCourtTotal(cluster), 6);
  });

  test('zero and non-numeric _courts are treated as unknown', () => {
    const cluster = fakeCluster([marker(0), marker('two'), marker(5)]);
    assert.equal(clusterCourtTotal(cluster), 7);
  });
});
