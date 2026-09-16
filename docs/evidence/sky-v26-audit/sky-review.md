# Independent HDR integration review

Reviewed final shader/lighting source at 2026-09-16T02:38:52.577Z in Q-sky-v26. Required color/renderer-state corrections passed the reusable oracle; the accepted native exception-allocation limit remains explicit below. This is not WebGL compilation, rendered-screen, GPU memory/FPS, or PS4-quality evidence.

The pre-correction fog source is preserved in checkpoint `8efa8a73600f694d06aa3e69dec64ff91eb84688`; its atmosphere SHA256 is `e706215383b3cced52a879c5bad8ccf141fbefeb0d4db8acb1526385ef9ff60c`.

## Findings and corrected behavior

1. **Fog and sky originally used different display transforms.** Three r186 `meshphysical` mixes fog after tone mapping/output conversion; `WebGLMaterials.refreshFogUniforms` only converts the supplied fog color to output color space. Copying raw HDR horizon radiance into fog therefore bypassed the sky's ACES transform. At full day the lower-horizon mismatch was approximately 0.03567 sRGB (9.1/255). The author added `src/sky-exposure.js:9`, matching native ACES matrices/fit/exposure, and applies it to fog while retaining raw radiance for the sky. The photograph blend now starts at elevation 0, and the day horizon includes the same photo gain. Native fog-uniform readback versus an independent translation of the installed shader agrees within 1.11e-16 in four day/night states. Night hemisphere fill is 0.54 and day fill 0.14; night HDR/direct-sun energy reaches zero.

2. **Native PMREM exceptions originally left renderer state changed.** Three's `_fromTexture` and `_applyPMREM` do not use `finally` for render target/XR/autoClear restoration. `src/sky-lighting.js:15` now saves target, cube face, mip, XR and autoClear, restoring them at line 28. Actual native PMREM control flow with an explicit throwing renderer boundary restores all five values for failures at passes 1, 3 and 19. Source input/generator and returned resources have explicit disposal. This test performs no GPU operations.

3. **The global IBL maximum is a cloud, not a remaining solar disc.** Original peak radiance is 60,671.4816; the processed central 1.75-degree solar region peaks at 3.423558984375. A real bright cloud remains at 15.3494609375, so a global `<10` assertion would wrongly require removing photographed cloud lighting. The visible source array remains byte-identical; lower ground replacement and solar filtering affect only the 512×256 IBL copy.

## Integration checks

- Original file: 1,435,119 bytes, SHA256 `fd94c84997b8a3c353b62c2125a9b44e19509956986a126e472684432a02d798`; real HDRLoader produces 1024×512 RGBA half-linear data (4,194,304 bytes), matching its native flipY and linear-sRGB contract.
- Measured source solar direction, visible inverse-yaw uniform, native `WebGLMaterials` environment rotation, and directional light agree. Native inverse-matrix source-direction error: 1.24e-16. Yaw preserves vertical/horizon orientation.
- One native PMREM bake uses 19 render-method calls and two 384×512 RGBA16F atlas targets; target face size is 128. These are observed CPU control flow and predicted allocation formats, not measured GPU allocations. Steady visible+IBL payload: 5,767,168 bytes; temporary input: 1,048,576 bytes; temporary ping target: 1,572,864 bytes. Latest single-host CPU measurements: HDR parse about 55 ms in the first complete run; preparation 153.9 ms in the final run. No device/FPS inference.
- Actual `createSceneView` waits for a delayed sky source before constructing a renderer, installs the exact returned CPU data and environment texture, and shares them across low/medium/high quality changes with no rebake. Disposal clears scene environment and shared HDR uniforms. Other asset loaders and renderer are explicitly doubled; scene objects and lifecycle are real.
- Download/decode failure clears the loader promise; a retry succeeds, concurrent successes share decoded CPU data, and decoder textures are disposed. Native Standard-material reflection remains in place; water/metal gate the previous analytic addition while HDR is active. Analytic sun/cloud additions are also suppressed for active HDR.
- Existing build snapshot read after the final shader correction: initial entry 163,175 bytes, Three chunk 576,585 bytes, dynamic scene chunk 129,484 bytes (3 JS chunks total). HDR is attached to the scene dynamic entry, absent from initial entry assets, and emitted bytes/hash match the source. The author's final provenance/documentation rebuild is separate; this read does not certify that later build or Site publication.

## Accepted native exception limit

If native PMREM throws before returning its output, the public API does not expose that output target to the caller. For injected failures at native passes 1, 3 and 19, the observed output receives no explicit dispose event; later-pass ping targets do receive disposal. The integrator chose to retain the public API and document this limit, without replacing renderer methods or relying on private generator allocation APIs. A supplied target on a fresh r186 generator is insufficient because it skips native internal LOD/ping initialization. **Actual GPU reclamation after this exception is unmeasured; this is not proof of a permanent GPU leak.** Successful returned output and normal resource release are covered.

## Exact source and reusable check

`sky-audit-report.json` contains all source/native-Three hashes and results; no audited source changed during the final run. Principal SHA256 values:

- atmosphere: `c78303af10af15142d6d9510dd398fd528205b6e3f2de711dc4093ff8ec1aef2`
- fog exposure: `211f200b8d36aa8b42e060541dcdb118ec335de75dd58226ea926be6da15b5c2`
- sky lighting: `7bd023cf23cc5269e2ce25e9c289d31e9f50ac870556e0f277c16414a4d40762`
- scene: `965711336afa602023a255218e95cb7c21bfd2b9c4eae926a1707fdff655a7c6`

Run `node verify-sky-integration.mjs /absolute/repo /absolute/output-report.json`. The oracle can be copied unchanged into the repository. Final result: exit 0, no failed assertions/source changes, with the native-allocation limits retained in the JSON `limitations` field. Provenance prose was still being completed by the author; no legal provenance or final distribution certification is implied.

## Final capability regression

The renderer double explicitly advertises support. Float-only and half-float-only support both follow native PMREM (19 calls, 2 atlases). No extension and an undefined extension API both return before reading the supplied null source, allocating targets, or calling PMREM (0 calls, 0 targets). Actual async SceneView boot succeeds in all four cases; unsupported cases retain the analytic sky with no scene environment. This is control-flow validation, not driver capability/FBO/pixel validation. The final report contains exact capability-source hashes and `pmrem.capabilitySamples`.
