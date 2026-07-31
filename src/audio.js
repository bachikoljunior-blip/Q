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
    case'tether':this.tone(160,440,.16,'sawtooth',.1*v);break;
    case'cut':this.tone(820,170,.1,'sawtooth',.1*v);break;
    case'kill':this.tone(210,92,.09,'square',.1*v);this.tone(620,360,.07,'sine',.05*v,.02);break;
    case'hurt':this.tone(170,46,.3,'sawtooth',.16*v);break;
    case'wave':this.tone(330,660,.16,'triangle',.1*v);this.tone(494,988,.18,'triangle',.08*v,.1);break;
    case'boss':this.tone(78,39,.7,'sawtooth',.16*v);break;
    case'upgrade':[440,554,659].forEach((f,i)=>this.tone(f,f*1.02,.15,'triangle',.07*v,i*.07));break;
    case'victory':[523,659,784,1047].forEach((f,i)=>this.tone(f,f,.28,'triangle',.1*v,i*.1));break;
    case'defeat':[294,220,147].forEach((f,i)=>this.tone(f,f*.65,.3,'sawtooth',.09*v,i*.13));break;
  }}
  start(){this.requested=true;if(!this.enabled()||this.timer)return;const play=()=>{if(!this.enabled())return;const notes=[110,147,165,220,165,147,123,147];const f=notes[this.step++%notes.length];this.tone(f,f,.38,'sine',.035,0,'music');if(this.step%2===0)this.tone(f*2,f*1.5,.2,'triangle',.018,0,'music')};play();this.timer=setInterval(play,480)}
  stop(){this.requested=false;clearInterval(this.timer);this.timer=0;this.stopVoices('music')}
  destroy(){this.stop();this.stopVoices();try{this.ctx?.close()}catch{}this.ctx=null;this.master=null}
}
