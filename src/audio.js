const cap = (n,min,max)=>Math.max(min,Math.min(max,n));
export class Sound {
  constructor(settings){this.settings=settings;this.ctx=null;this.master=null;this.timer=0;this.step=0;this.voices=[];this.requested=false}
  async unlock(){
    if(!this.settings().sound)return false;
    try{
      const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
      if(!Audio)return false;
      if(!this.ctx){this.ctx=new Audio({latencyHint:'interactive'});this.master=this.ctx.createGain();this.master.gain.value=.19;this.master.connect(this.ctx.destination)}
      if(this.ctx.state!=='running')await this.ctx.resume();
      if(this.requested)this.start();
      return this.ctx.state==='running';
    }catch{return false}
  }
  enabled(){return Boolean(this.ctx&&this.ctx.state==='running'&&this.settings().sound)}
  setEnabled(value){if(this.master)this.master.gain.value=value?.19:0;if(!value)this.stopVoices()}
  tone(freq,end,duration=.12,type='sine',volume=.1,delay=0,group='fx'){
    if(!this.enabled())return;
    while(this.voices.length>=12)this.endVoice(this.voices[0]);
    const now=this.ctx.currentTime+delay,osc=this.ctx.createOscillator(),gain=this.ctx.createGain();
    osc.type=type;osc.frequency.setValueAtTime(Math.max(20,freq),now);osc.frequency.exponentialRampToValueAtTime(Math.max(20,end||freq),now+duration);
    gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(Math.max(.0001,volume),now+.01);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    osc.connect(gain);gain.connect(this.master);const voice={osc,gain,group,timer:0};this.voices.push(voice);
    const done=()=>this.endVoice(voice);osc.onended=done;voice.timer=setTimeout(done,(delay+duration+.15)*1000);osc.start(now);osc.stop(now+duration+.03);
  }
  endVoice(voice){if(!voice)return;clearTimeout(voice.timer);voice.osc.onended=null;try{voice.osc.stop()}catch{}try{voice.osc.disconnect();voice.gain.disconnect()}catch{}const i=this.voices.indexOf(voice);if(i>=0)this.voices.splice(i,1)}
  stopVoices(group){for(const voice of [...this.voices])if(!group||voice.group===group)this.endVoice(voice)}
  event(name,power=1){if(!this.enabled())return;const v=cap(Number(power)||1,.2,1.5);switch(name){
    case'ui':this.tone(520,760,.07,'triangle',.07*v);break;
    case'attack':this.tone(310,110,.1,'sawtooth',.07*v);break;
    case'dodge':this.tone(140,420,.14,'triangle',.06*v);break;
    case'hit':this.tone(118,72,.08,'square',.08*v);this.tone(560,280,.06,'triangle',.04*v,.02);break;
    case'stagger':this.tone(94,47,.18,'square',.11*v);this.tone(420,180,.12,'triangle',.055*v,.04);break;
    case'hurt':this.tone(170,46,.3,'sawtooth',.16*v);break;
    case'pickup':this.tone(560,820,.1,'sine',.07*v);break;
    case'heal':this.tone(260,520,.25,'sine',.07*v);this.tone(390,780,.22,'triangle',.04*v,.08);break;
    case'danger':this.tone(330,245,.13,'sawtooth',.075*v);this.tone(220,175,.11,'triangle',.05*v,.09);break;
    case'discover':[294,440,587].forEach((f,i)=>this.tone(f,f*1.02,.28,'triangle',.065*v,i*.09));break;
    case'boss':this.tone(78,39,.7,'sawtooth',.16*v);break;
    case'victory':[523,659,784,1047].forEach((f,i)=>this.tone(f,f,.28,'triangle',.1*v,i*.1));break;
  }}
  start(){this.requested=true;if(!this.enabled()||this.timer)return;const play=()=>{if(!this.enabled())return;const notes=[110,147,165,196,147,123,98,123,147,220,196,165];const f=notes[this.step++%notes.length];this.tone(f,f*.995,1.8,'sine',.021,0,'music');if(this.step%3===0)this.tone(f*2,f*1.5,.7,'triangle',.012,.16,'music')};play();this.timer=setInterval(play,1550)}
  stop(){this.requested=false;clearInterval(this.timer);this.timer=0;this.stopVoices('music')}
  destroy(){this.stop();this.stopVoices();try{this.ctx?.close()}catch{}this.ctx=null;this.master=null}
}
