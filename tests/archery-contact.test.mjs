import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectArchery} from '../scripts/verify-archery-contact.mjs';
test('real ranger grip, draw finger, bowstrings and saved release share the existing Game launch line',async()=>{const report=await inspectArchery();assert(report.coreUnchanged);assert.equal(report.rates.length,3);assert.equal(report.interrupts,4);});
