/*!
The MIT License

Copyright © 2010-2026 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
import { Matrix3 } from 'three';

// CPU counterpart of Three r186 ACESFilmicToneMapping, MIT licensed; see
// assets/sky/THREE-LICENSE.txt. Fog is mixed AFTER tone mapping in meshphysical,
// so its linear color must contain the display-referred ACES result already.
const input=new Matrix3().set(.59719,.35458,.04823,.076,.90834,.01566,.0284,.13383,.83777);
const output=new Matrix3().set(1.60475,-.53108,-.07367,-.10208,1.10813,-.00605,-.00327,-.07276,1.07602);
const fit=v=>(v*(v+.0245786)-.000090537)/(v*(.983729*v+.432951)+.238081);
export function skyFogColor(radiance,exposure,target) {
  target.copy(radiance).multiplyScalar(exposure/.6).applyMatrix3(input);
  target.r=fit(target.r);target.g=fit(target.g);target.b=fit(target.b);target.applyMatrix3(output);
  target.r=Math.min(1,Math.max(0,target.r));target.g=Math.min(1,Math.max(0,target.g));target.b=Math.min(1,Math.max(0,target.b));
  return target;
}
