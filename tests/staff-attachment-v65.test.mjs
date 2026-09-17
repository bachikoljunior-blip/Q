import test from 'node:test';
import {verifyAttachment,verifyFailureRecovery} from '../review/staff-attachment-v65/verify.mjs';
test('registered right-hand point closes while 19 staff parts stay rigid through breathing, terrain and affine ancestors',()=>{verifyAttachment();});
test('unsupported or unreachable frames do not corrupt the arm and recover on the next valid frame',()=>{verifyFailureRecovery();});
