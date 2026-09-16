import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectSettlement} from '../scripts/verify-settlement-contact.mjs';
test('actual fixed houses and bridge attachments meet ground without changing movement or closed-door visibility',async()=>{const result=await inspectSettlement();assert(result.houseVerticalBoundsOnly);assert(result.horizontalWorldAndSaveUnchanged);assert.equal(result.addedDraws,0);});
