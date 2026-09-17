# F17 reference checkpoint — v64

Status: reference production only. The full-character micro-part reference set is incomplete; the user's required image-first order supersedes starting another local 3D patch. No new geometry, runtime source, rig, UV, test, build, or Site change was made. Existing v63 lower-face source remains byte-identical (b93311bafce2b211a944604ce02f7cc0878bb0e14d5eae3066ca420b490b3d0b).

## Selection and intended dependency

The v61 type list defines F17 as the lower lip and sublabial crease. It is immediately above the existing central F11 chin. A future small patch could share only F11's inner edge, with upper and side edges left for F16 upper lip and mouth-corner neighbors. This is a dependency proposal, not an implemented seam. The F03 temple is not a substitute for the missing orbital region. F01 forehead must not be welded directly to F05 across the eyes.

## Actual visual inspection

Both raw generated PNGs were viewed after generation. The first image incorrectly includes an upper-lip ridge and an interior full-mouth seam in FRONT and THREE-QUARTER, despite the specified lower-lip-only scope. It is not accepted as the modeling shape.

One targeted correction removes that extra upper-lip ridge in FRONT and THREE-QUARTER. Those two panels now convey a small lip roll, shallow hollow below, and lower apron; the locator identifies the region directly above F11. However, TRUE SIDE still shows an upper spike before the projecting roll and a sharply indented profile, so it cannot be assumed to be the strict side projection of the corrected frontal surface. TOP is a curved arc but does not independently resolve the groove or boundary. The locator's F17/F11 adjacency is schematic and not an exact common curve. Clay grain, apparent rear thickness and dark baked shadows are not skin geometry or texture requirements.

The second image is preserved as a partial conceptual shape reference, not an approved same-object multi-angle specification. A later coverage review must resolve that side-profile ambiguity before implementing F17. No pixel-derived dimensions or physical calibration is claimed. Generated faces are fictional; the bitmap is not a real game render or a scan.

## Files and measured work

Raw images, both exact prompts, provenance and separate timing markers are in this directory. Builtin generation calls completed in 39.0 s and 30.8 s respectively; wall markers also include pre-call writing and orchestration and are not pure service latency. Specification selection, first generation, targeted correction and checkpoint are separately recorded in timing.json. 3D implementation, tests, CPU plots and WebGL validation were not performed in this unit. These reference operations do not demonstrate instant modeling or final character quality.

All tools reached their terminal responses. No extra generation, image conversion, external asset request, remote mutation or alternate preview was attempted. Existing generated source files remain untouched. Further work is the complete head type/instance coverage and whole-character assembly correspondence, followed by independent reference review, before new 3D construction.
