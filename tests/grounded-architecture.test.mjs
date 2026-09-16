import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectArchitecture} from '../scripts/verify-architecture-grounding.mjs';
test('real structures close the old floating foundations and share native ray/camera/projectile bounds',async()=>{
  const report=await inspectArchitecture();assert.equal(report.supports,37);assert(report.contactMax<0);assert.equal(report.verticalConnection.legacyNegativeControls,3);assert(report.worldAndFreshSaveUnchanged);
});
