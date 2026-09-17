import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {makeMiraStaff} from '../review/staff-v63/assembly.mjs';
import {batchStaff} from '../review/staff-batch-v64/staff-batch.mjs';
import {inspectBatch} from '../review/staff-batch-v64/inspect-batch.mjs';
import {disposeMiraLanternPartial as disposeSource} from '../review/lantern-micro-v62/mira-lantern-ribs.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),out=resolve(root,'docs/evidence/mira-staff-batch-v64');await mkdir(out,{recursive:true});
const startedUTC=new Date().toISOString(),start=performance.now(),source=makeMiraStaff(),created=performance.now(),batch=batchStaff(source),batched=performance.now();
const report=inspectBatch(source,batch),inspected=performance.now();
report.materialBuckets=batch.manifest.buckets;report.memory={addedGeometryBytes:report.batch.uniqueBufferBytes-report.source.uniqueBufferBytes,coexistingSourceAndBatchGeometryBytes:report.source.uniqueBufferBytes+report.batch.uniqueBufferBytes,totalAllocatedTemporaryTransformedGeometryBytes:report.source.perMeshBufferBytes,largestTemporaryBucketGeometryBytes:Math.max(...batch.manifest.buckets.map(b=>b.bufferBytes)),note:'Typed geometry/index byte counts only. Temporary clone sums describe allocations, not simultaneous peak RSS, GC, GPU, object or material size.'};
report.rendering={sourceOpaqueMeshes:18,batchOpaqueMeshes:3,sourceTransmissiveMeshes:1,batchTransmissiveMeshes:1,groupCount:batch.group.children.reduce((s,m)=>s+m.geometry.groups.length,0),measuredWebGLDrawCalls:null,note:'19 to 4 native single-material render objects; single fully visible main pass submission opportunity only. Shadow/transmission passes, culling and actual device/GPU speed are unmeasured.'};
report.timing={startedUTC,sourceConstructionMs:created-start,batchConstructionMs:batched-created,cornerAuditMs:inspected-batched,finishedUTC:new Date().toISOString()};
report.sourceFiles=[];for(const path of ['review/staff-v63/assembly.mjs','review/staff-v63/staff-parts.mjs','review/lantern-v63/lantern-head.js','review/lantern-micro-v62/mira-lantern-ribs.js','review/micro-v61/mira-micro-parts.js','review/staff-batch-v64/staff-batch.mjs','review/staff-batch-v64/inspect-batch.mjs','scripts/export-mira-staff-batch-v64.mjs','tests/mira-staff-batch-v64.test.mjs']){const b=await readFile(resolve(root,path));report.sourceFiles.push({path,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});}
await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
await writeFile(resolve(out,'part-ranges.json'),JSON.stringify(batch.manifest,null,2)+'\n');
const native={units:'metres',coordinateFrame:batch.manifest.coordinateFrame,manifest:batch.manifest,meshes:batch.group.children.map(m=>({id:m.name,matrixWorld:m.matrixWorld.toArray(),material:m.material.toJSON(),index:{type:m.geometry.index.array.constructor.name,array:Array.from(m.geometry.index.array)},attributes:Object.fromEntries(Object.entries(m.geometry.attributes).map(([k,a])=>[k,{type:a.array.constructor.name,itemSize:a.itemSize,normalized:a.normalized,array:Array.from(a.array)}]))}))};
await writeFile(resolve(out,'batch-geometry.json'),JSON.stringify(native)+'\n');
console.log(JSON.stringify({sourceFiles:report.sourceFiles.slice(-4),memory:report.memory,source:report.source,batch:report.batch,positionMm:report.maxPositionMm,normalError:report.maxNormalError,otherMismatch:report.otherAttributeMismatch,indexMismatch:report.indexMismatch,materialMismatch:report.materialMismatch,timing:report.timing},null,2));
batch.dispose();disposeSource(source);
