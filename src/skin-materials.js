import * as T from 'three';

// Only smith has an explicit beard in the current authored recipe. Story text
// does not establish ages/genders for the other roles; do not infer from names.
export const SKIN_TEXTURE_ROLES = Object.freeze(['smith']);
// Mean of 46 surface collar vertices (47 original-UV corners, averaging both
// sides of vertex 857), using linear-sRGB bilinear q95 samples. Synthetic cap
// UVs are excluded. Normalizes base tint to the neck, not its illumination.
export const SKIN_NECK_REFERENCE = Object.freeze([0.756385085539447, 0.3947322188942361, 0.23747912103991894]);
const faces = new Map();
let installed = null;
function apply(material, base) {
  material.map = installed;
  material.color.copy(base);
  if (installed) material.color.setRGB(base.r / SKIN_NECK_REFERENCE[0], base.g / SKIN_NECK_REFERENCE[1], base.b / SKIN_NECK_REFERENCE[2], T.LinearSRGBColorSpace);
  material.needsUpdate = true;
}
export function registerFaceSkin(material, skin, role) {
  if (!SKIN_TEXTURE_ROLES.includes(role)) return material;
  const base = skin.color.clone(); faces.set(material, base); apply(material, base);
  return material;
}
export function installSkinTexture(texture) {
  if (texture !== null && (!texture?.isTexture || texture.colorSpace !== T.SRGBColorSpace || texture.flipY !== true || texture.image?.width !== 2048 || texture.image?.height !== 2048)) throw Error('Invalid decoded skin texture');
  installed = texture;
  for (const [material, base] of faces) apply(material, base);
  return texture;
}
