# Q v29 skin role review

Read-only role/appearance review on the requested `Q-skin-v29` checkout (parent-stated base `d03974f`). No repository, runtime, image or UV writes. No browser or WebGL. Scope: eligibility for this exact young light-skinned male source diffuse, and implications for face/neck color consistency.

**Recommended first allowlist: `smith` only (鍛冶師レン), as a bounded visual comparison.** Existing source provides a specific chin beard mesh for that role and calls the human recipes adult-proportioned. That is the strongest evidence that stubble in this texture fits an existing depiction. It is not proof of canon gender, exact age or ancestry. The texture's metadata must not be treated as the character's newly established identity.

If “semantically proven” requires explicit narrative sex and exact young-adult age, no role meets that stronger standard in the inspected files. This does not require stopping a narrowly documented smith material comparison; it does exclude silently broadening the texture to everyone.

| Runtime role | Named identity / actual role evidence | Existing visual evidence | Recommendation for this unit |
|---|---|---|---|
| `smith` | 鍛冶師レン; `src/village.js:6`; forge/gathering dialogue | Dark hair, broad profile; unique `if(type==='smith')` chin hair ellipsoid at `[0,-.088,.067]`, radius `[.089,.043,.06]` in original detailed-geometry line205 | **One-role comparison candidate.** Existing beard/adult styling supports stubble compatibility; age and gender still unspecified in narrative. |
| `npc` / alias `keeper` | 灯守ミラ; `src/core.js:27`, `main.js` dialogue | Hair color `0xa7a397`, light gray; no chin beard mesh | Exclude. Young male stubble and scalp could add a new age/gender-coded appearance. Gray hair is an appearance cue, not a proven age. |
| `sena` | 渡し守セナ; `src/content.js:7` | Explicit extra back-hair mass, no chin beard | Exclude. Gender/age not established; long hair must not be used to assert female or male identity. |
| `healer` | 薬師イオ; `src/village.js:7` | Brown hair, no beard | Exclude. Occupation and use of 私 do not establish gender or age. |
| `patient` | 療養人凪; `src/village.js:8` | Slight body; runtime scale .97; no beard | Exclude. Illness, body scale and dialogue do not establish a young male identity; source's healthy facial color may also change the existing pale role. |
| `porter` | 荷運びトウ; `src/village.js:9` | Broad body, dark hair, darker skin palette | Exclude for now. Physical work and broad build do not establish gender; would also need separate tint/color validation. |
| `traveler` | 旅人アサ; `src/village.js:10` | Hair `0x746250`, muted gray-brown; no beard | Exclude. Age/gender unspecified; muted hair is only a potential age-style mismatch cue. |
| `scout` | 斥候ユノ; `src/village.js:11` | Hood and brown hair; no beard | Exclude. No narrative demographic proof. |
| `courier` | 運び手ナル; `src/world-regions.js:21` | Pack, brown hair, no beard | Exclude. Name, work and dialogue do not establish gender or age. |
| `player` | 巡礼者; README/core | Adult-proportioned armored hooded body; brown hair; no unique beard | Exclude from initial allowlist. Player identity is not canonically specified by inspected code; source texture would make a new appearance choice. |
| `soldier` / `knight` | Anonymous melee soldiers and themed guardians | Adult armor, helmet, brown hair | Exclude from initial allowlist. Combat role is not gender evidence. Theme variations share this role and need explicit consideration before any broader use. |
| `ranger` / `archer` | Anonymous archers | Hood and brown hair | Exclude from initial allowlist; same missing demographic evidence. |
| `boss` | 灰冠の番人 | Gray hair `0x777c70`, distinct gray skin `0x8b8270`, scale2.3 | Exclude. Young human flesh/stubble could overwrite the existing aged/supernatural styling; no exact age asserted. |
| `wolf` | Wolf | Animal | Not applicable. |

## Evidence limits

The inspected narrative/runtime files contain no explicit age/gender fields and searches for 女性/男性/少女/少年/老人/若者/青年/性別/年齢/female/male/gender did not identify a role definition. No role was confirmed female in this inspection, and no role should be labeled female solely from its name, long hair, speech or occupation. Likewise the absence of a female label does not authorize applying the male source texture.

Read set: `src/content.js`, `core.js`, `village.js`, `world-regions.js`, `gathering-content.js`, relevant `main.js` dialogue, `actor-models.js`, `assets/characters/detailed-geometry.js`, `detailed-provenance.json`, README, `docs/ACTOR_REALISM_V23.md`, and relevant project-state identity descriptions. Legacy KayKit keeper/pilgrim assets are a separate family and do not determine the procedural actors' gender.

## Face/neck material constraint for the proposed smith comparison

Smith's existing skin palette is `0x98765d`; source diffuse is light skin. A colored face map multiplied by the existing skin color is not guaranteed to match the untextured neck or lids, because the diffuse already contains color. Normalize/tint using measured source reference color in linear light and keep the source pixel data unchanged; keep the scalar/colored calibration explicit. A global hand/neck material or changing every recipe would broaden this unit.

The target face includes the source collar and concealed cap, while separate neck/hands and the two separate moving eyelid patches still use the role's skin material. Review the face-to-neck and face-to-lid transition numerically and then in the official rendered comparison. A single average-color equality cannot prove every UV seam pixel matches: source local variation and baked shading remain. Source scalp stubble under existing hair also needs rendered inspection. Shared texture should be immutable, with allowlisted material assignment and role-specific calibration rather than mutating the shared `Q skin` material.

## Input snapshots

- `src/content.js`: SHA-256 `6ed2588b9620268f806e0feccbfae2816d8463535a8b98ca755d3289a05f63d6`; 1472 bytes.
- `src/core.js`: SHA-256 `df561b92de125935f9b40e67cb24e71ad9b632e542c6ab6c7cf9fe009f734050`; 38827 bytes.
- `src/village.js`: SHA-256 `418ab8ed27fd12ac8bda78a153f367333642383ba1b57c1f8ab4f848fcc0d571`; 12153 bytes.
- `src/world-regions.js`: SHA-256 `83b5d9bc4a1451f06f404353f131cf1fd73e3b992d0f5936ac8493ecae81178d`; 2567 bytes.
- `src/gathering-content.js`: SHA-256 `adc3e346bbdc39e3c8f423267dea8c5f617975ea27798c1e80f155a8e78ef56e`; 3877 bytes.
- `src/assets/characters/detailed-geometry.js`: SHA-256 `a320835670bd43147e793651834034a87ad23d16f87c191b412a5de881a17849`; 29688 bytes.
- `README.md`: SHA-256 `693523a2dac5c39a4fb0cb2bad7b820e8c72ab284ecaac47b5757ee0e697aad5`; 13630 bytes.
