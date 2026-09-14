// Shared authoring data: collision, exploration, maps and rendering use these coordinates.
export const WORLD_BOUNDS=Object.freeze({minX:-460,maxX:280,minZ:-282,maxZ:220});
export const SALT_REACH=Object.freeze({id:'salt-reach',name:'白塩の段丘',en:'THE SALT REACH',x:-340,z:0,edgeX:-260});
export const regionAt=(x,z)=>x<SALT_REACH.edgeX?SALT_REACH:null;
export const SALT_JOURNEY=Object.freeze({
  id:'salt-return',title:'運び手の帰り道',
  board:{id:'salt-board',type:'expedition',kind:'board',name:'運び手の伝言板を読む',x:-246,z:20},
  handle:{id:'salt-handle',type:'expedition',kind:'handle',name:'巻上げ機の取っ手を回収する',x:-402,z:-25},
  winch:{id:'salt-winch',type:'expedition',kind:'winch',name:'巻上げ機を修理する',x:-292,z:0},
  gate:{id:'salt-gate',type:'salt-gate',x:-283,z:0,r:5.8,height:4},
  routes:[
    {id:'north',name:'北の岩棚',points:[{x:-246,z:20},{x:-263,z:-42},{x:-312,z:-42},{x:-356,z:-16},{x:-402,z:-25}]},
    {id:'south',name:'南の塩原',points:[{x:-246,z:20},{x:-271,z:48},{x:-324,z:48},{x:-363,z:18},{x:-402,z:-25}]},
  ],
  encounters:[{id:'salt-guard',x:-398,z:-18,type:'knight'},{id:'salt-hound',x:-407,z:-39,type:'wolf'},{id:'salt-archer',x:-389,z:-38,type:'ranger'}],
  scenery:[{id:'salt-cistern',x:-368,z:-54,r:5,height:7,type:'salt-cistern'},{id:'salt-stack',x:-422,z:22,r:4,height:10,type:'salt-rock'}],
  reward:{ash:120,xp:100,herbs:4},
  inscription:'取っ手は西の見張り場に残した。北の岩棚か南の塩原を回れ。巻上げ機を直せば、石門を抜けて谷へ帰れる。道が開いたら、この板に印を刻んでくれ。—— 運び手 ナル',
});
export const SALT_COURIER=Object.freeze({
  id:'courier-naru',name:'運び手ナルと話す',label:'運び手 ナル',role:'courier',type:'npc',x:-398,z:-25,
  // Alternating work sites force the courier through the repaired gate instead of teleporting an aftermath prop.
  routines:[
    {until:.23,x:-398,z:-25,activity:'見張り場の荷をまとめる'},
    {until:.48,x:-247,z:16,activity:'谷側へ塩袋を届ける'},
    {until:.73,x:-365,z:-39,activity:'貯水槽で荷を積み直す'},
    {until:1,x:-272,z:0,activity:'石門の轍を確かめる'},
  ],
});
export const SALT_TARGETS=[SALT_JOURNEY.board,SALT_JOURNEY.handle,SALT_JOURNEY.winch];
export const saltObstacles=()=>[
  {...SALT_JOURNEY.gate},
  ...[-27,-21,-15,-9,9,15,21,27].map((z,i)=>({id:`salt-wall-${i}`,x:-283,z,r:3,height:5+(i%3),type:'salt-rock'})),
  ...SALT_JOURNEY.scenery.map(o=>({...o})),
];
