import * as T from 'three';
import { heightAt, riverX } from './core.js';

// This game's river is a wadeable shallow stream, with the terrain height also
// driving footsteps and collision. Follow that exact bed across the width: the
// old centreline-only strip cut under one bank and floated above the other.
// No reflection render target, depth texture, physics change or runtime remesh.
export const WATER_SURFACE = Object.freeze({ halfWidth:10.5, minZ:-205, maxZ:220,
  segmentsAcross:20, segmentsAlong:256, depth:.14, maxWave:.021 });
export function createWaterSurface() {
  const s=WATER_SURFACE;
  const geometry=new T.PlaneGeometry(s.halfWidth*2,s.maxZ-s.minZ,s.segmentsAcross,s.segmentsAlong);
  geometry.rotateX(-Math.PI/2);geometry.translate(0,0,(s.minZ+s.maxZ)/2);
  const positions=geometry.attributes.position;
  for(let i=0;i<positions.count;i++) {
    const z=positions.getZ(i),x=positions.getX(i)+riverX(z);
    positions.setXYZ(i,x,heightAt(x,z)+s.depth,z);
  }
  geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
  geometry.name='Q shallow flowing stream';geometry.userData={surface:'terrain-following-water',...s};
  return geometry;
}
