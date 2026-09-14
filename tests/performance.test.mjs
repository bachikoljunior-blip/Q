import test from 'node:test';
import assert from 'node:assert/strict';
import {FrameMetrics} from '../src/performance.js';

test('whole-run stalls survive the rolling window without retaining every frame',()=>{
  const m=new FrameMetrics(10);
  for(let i=0;i<100;i++)m.record(80);
  for(let i=0;i<900;i++)m.record(16);
  const s=m.snapshot();
  assert.equal(s.framesOver50Ms,0);assert.equal(s.worstFrameMs,16);
  assert.equal(s.session.framesOver50Ms,100);assert.equal(s.session.worstFrameMs,80);
  assert.equal(s.session.p95FrameMsUpperBound,80);assert.equal(s.session.seconds,22.4);
  assert.equal(s.session.averageFps,1000*1000/22400);
  assert.equal(m.frames.length,10);assert.equal(m.histogram.length,1001);
});
test('pause, hidden-tab and new-session gaps never become active frame samples',()=>{
  const m=new FrameMetrics();
  m.sample(0,true);m.sample(16,true);m.sample(20,false);
  m.sample(30000,true);m.sample(30016,true);
  assert.equal(m.snapshot().session.seconds,.032);
  m.reset();m.sample(60000,true);assert.equal(m.snapshot(),null);
  m.sample(60020,true);assert.equal(m.snapshot().session.samples,1);
  assert.equal(m.snapshot().session.worstFrameMs,20);
});
test('whole-run p95 reports its quantization and bounds long-frame overflow',()=>{
  const m=new FrameMetrics();
  for(let i=0;i<94;i++)m.record(16.7);
  for(let i=0;i<6;i++)m.record(1200.5);
  m.record(NaN);m.record(-1);m.record(Infinity);
  assert.equal(m.snapshot().session.samples,100);
  assert.equal(m.snapshot().session.overflowFrames,6);
  assert.equal(m.snapshot().session.p95FrameMsUpperBound,1200.5);
  m.reset();for(let i=0;i<100;i++)m.record(16.7);
  assert.equal(m.snapshot().session.p95FrameMsUpperBound,17);
  assert.equal(m.snapshot().session.quantileResolutionMs,1);
});
