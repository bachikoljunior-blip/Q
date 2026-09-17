# Clothing boundary registration v65

Author design data only. No mesh, faces, runtime asset or remote mutation.

Run from repository root, in order:

    python review/cloth-registration-v65/generate.py
    python review/cloth-registration-v65/export_ports.py
    python review/cloth-registration-v65/check.py
    python review/cloth-registration-v65/plot.py

Python requires NumPy; plotting requires Matplotlib. Author dimensions/recipes are in generate.py and frames.py. The authoritative output is docs/evidence/mira-assembly-v65/cloth-registration/CLOTH_AUTHOR_SOURCE.json.

Each boundary stores33 samples with position, normal, tangent, UV, weights and explicit Hermite derivative. Shared owners refer to one curve ID. surfaceProjection curves use Hermite Y/Z with X evaluated by the same referenced W02 RBF.

Smooth junctions share node tangent planes. Their actual derivatives were repaired; the source records103 formerly rank3 nodes and15 intentional turnback/material/layer domain splits. This is not a normal-only average.

W02 uses stored cubic-RBF coefficients, with391 unique constraints per side: boundary, six fold ends, P04 landing. Canonical projected curves fix continuous correspondence. Coons/support recipes consume the same curves. The remaining polygon support recipes are author design, not validated face surfaces.

check.py covers actual numeric arrays, ownership, closed perimeters, weights, normal-domain node ranks, RBF constraints and source image hashes. It does not test final face normals, cloth physics, triangle collision or gameplay.
