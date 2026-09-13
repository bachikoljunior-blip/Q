// A single deterministic placement list drives the rendered trunks and solids.
export function createWoodland(rng,{places,bridges,npcs,camp,obstacles,enemies,pickups,inWater}){
  const trees=[],close=(a,b,r)=>(a.x-b.x)**2+(a.z-b.z)**2<r*r;
  for(let attempt=0;attempt<920;attempt++){
    const x=(rng()-.5)*550,z=215-rng()*490,p={x,z};
    if(Math.abs(x)<10||inWater(x,z))continue;
    if(places.some(place=>close(p,place,place.type==='boss'?30:20)))continue;
    if(npcs.some(npc=>close(p,npc,10))||close(p,camp,18))continue;
    if(bridges.some(b=>Math.abs(x-b.x)<24&&Math.abs(z-b.z)<6))continue;
    if(obstacles.some(o=>close(p,o,o.r+2)))continue;
    if(enemies.some(e=>close(p,e,3))||pickups.some(item=>close(p,item,1.8)))continue;
    if(trees.some(tree=>close(p,tree,1.6)))continue;
    trees.push({id:`tree-${trees.length}`,x,z,h:4+rng()*7,gold:x<-45&&z>-100});
  }
  return trees;
}
