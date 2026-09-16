// Reproduce the same title loading transition at the fixed pre-fix source and current source.
// Browser video APIs, timers and DOM are explicit fixtures; no decoder/GPU memory measurement.
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {compileMain,createMainRuntime,deferred} from '../main-runtime-fixture.mjs';
import {Game} from '../../src/core.js';
// Published equivalent of the author's local base: identical tree, fetchable from GitHub.
const base='26bd980546bbf0dcc7fb0d83697cf35202c3e365';
const root=new URL('../../',import.meta.url),get=(path,before)=>before?execFileSync('git',['show',base+':'+path],{cwd:root,encoding:'utf8'}):readFileSync(new URL(path,root),'utf8');
const hash=s=>createHash('sha256').update(s).digest('hex');
const testSource=readFileSync(new URL('../title-cinematic.test.mjs',import.meta.url),'utf8');
const fixtureSource=testSource.slice(testSource.indexOf('function titleBoundary('),testSource.indexOf("\ntest('bounded title"));
const report={base,boundary:'Production title controller + production main compiled separately, with explicit DOM/video/timer/Scene/audio device fixtures. Source detachment is a release request, not measured physical reclamation.',rows:[]};
for(const before of[true,false]){
 const source=get('src/title-cinematic.js',before),main=get('src/main.js',before);
 const {mountTitleCinematic}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const boundary=new Function('mountTitleCinematic',fixtureSource+';return titleBoundary;')(mountTitleCinematic);
 const b=boundary({videoAvailable:true,queuedPause:true});b.timersRun();b.plays[0].resolve();await Promise.resolve();await Promise.resolve();
 const read=()=>({sourceAttached:b.video.src!=='',paused:b.video.paused,loadCalls:b.video.loads,pendingTimers:b.timers.size,animationFrames:b.frames.size,hasVideo:b.root.classList.contains('has-video'),loadingVisible:!b.nodes['title-loading'].classList.contains('hidden')});
 const title={playing:read()};b.api.setLaunching(true);title.afterLaunchRequest=read();b.api.setActive(false);b.api.setActive(true);b.timersRun();title.afterSettingsRoundtrip=read();b.api.setLaunching(false);b.timersRun();title.afterFailedLaunch=read();b.api.dispose();
 const compiled=await compileMain({mutate:()=>main});
 const runtime=createMainRuntime(compiled);await runtime.click('start');await runtime.flush();
 const mainStart={events:runtime.events.slice(),sceneCalls:runtime.sceneCalls,launching:runtime.titleState.launching,sourceStage:'Production main reaches deferred Scene factory; title API is a call recorder in this boundary.'};runtime.scene.reject(Error('audit failure'));await runtime.flush();mainStart.failure={playing:runtime.state.playing,launching:runtime.titleState.launching,audioRunning:runtime.audioRunning};
 const input=createMainRuntime(compiled),file=deferred();await input.importFile(new Game().serialize(),{delayed:file});
 const importReadPending={sceneCalls:input.sceneCalls,launching:input.titleState.launching,disabled:['start','continue','import-title-save'].map(id=>input.element(id).disabled)};file.resolve('invalid');await input.flush();
 report.rows.push({version:before?'before':'after',sourceSha256:{main:hash(main),title:hash(source)},title,mainStart,importReadPending,invalidImportRecovery:{launching:input.titleState.launching,sceneCalls:input.sceneCalls,audioRunning:input.audioRunning}});
}
writeFileSync(new URL('docs/evidence/title-loading-v30.json',root),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
