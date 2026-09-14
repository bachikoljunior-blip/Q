// Use only after a subtree's LOCAL positions/rotations/scales are final. Material,
// visibility, shader uniforms and instance draw counts remain independently mutable.
// Keep native world updates: camera/light work and moving ancestors still need them.
// As with Three.js manual matrices, future local edits require updateMatrix(), and
// parent changes require the normal top-down updateMatrixWorld before world queries.
export function bakeStaticTransforms(...roots) {
  for (const root of roots) root.traverse(node => {
    node.updateMatrix();
    node.matrixAutoUpdate = false;
  });
}
