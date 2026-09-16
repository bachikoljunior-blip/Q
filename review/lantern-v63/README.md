# Development-only lantern head

`makeLanternHead({glassSegments:16})` from `lantern-head.js` returns nine native meshes in staff coordinates (metres, +Y up, +Z front). The default 32-angle version is the original finite comparison, not the selected export. The existing `disposeMiraLanternPartial(group)` disposes this group's unique geometries and materials. No production module imports this helper.

S07/S08/S16 are new; S14 is an internally revised version. Four ribs and S13 are reused unchanged. S06 and S15 remain separate-author parts. Join registrations are Y1423 and Y1674 mm; exact snapshot contact measurements and Float32 gaps are documented in [the report](../../docs/evidence/mira-lantern-v63/REPORT.md). The development export also includes those two boundary meshes for inspection, without incorporating their helper into this source.

Reference images were generated and selected before implementation; they are not mapped onto these meshes. The selected glass material is an unviewed shader intent. The CPU projection is a geometry diagnostic, not a game/rendered appearance comparison. Full staff, grip/pose/ground integration and whole-actor budget remain separate work.
