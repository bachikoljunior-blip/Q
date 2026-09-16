# Offline asset authoring capability — bounded preflight

**Blender is a legitimate candidate for the requested individual-mesh/UV inspection, but this environment is not yet demonstrated to run it. No package was installed or downloaded.** The portable application is the more plausible route than the particular `bpy` wheel verified here. An ordinary official distribution-directory read failed; no alternate host/tool transport was attempted after that failure.

This workflow would inspect an individual source model with its original image and UVs using a standard 3D authoring application. It would not supply a Site/game screenshot, emulate WebGL, measure a phone, certify PS4 parity, repair an image through a different tool, or replace the unavailable supervised preview.

## Confirmed local facts

`local-preflight.json` records the repeatable read-only checks:

- Ubuntu 24.04.3, x86-64, glibc 2.39; Python 3.12.14, ABI `cpython-312-x86_64-linux-gnu`.
- No `blender` executable or `bpy`, `trimesh`, `pyrender`, `moderngl` Python modules. Matplotlib/NumPy/pip are present; they were not used as a substitute 3D renderer.
- Nine logical CPUs reported; NumPy's runtime CPU feature detection reports SSE4.2 and AVX2.
- Workspace free space was 21,765,963,776 bytes on the final preflight. This is sufficient for the archive sizes below, but unpacked installation size is not measured.
- Library-name discovery finds libc, libstdc++, libgcc_s, X11/Xi/Xfixes/Xrender/Xxf86vm, GL/EGL, SM/ICE and zlib. This is not a successful dynamic-link/load test of Blender or proof of a graphics context.
- `sysconf` reports 23,109,894,144 physical-memory bytes. Process/container RAM and CPU quotas remain unknown: the queried cgroup files are absent. A CPU count or host memory figure must not become a rendering-performance promise.

Blender's official requirements page lists 64-bit Linux with glibc 2.28+ and a CPU with SSE4.2; the local architecture/libc/features meet those published baseline conditions. The page also describes portable application use. Its interactive GPU requirements are not a successful local CPU-headless startup test. [Official Blender requirements](https://www.blender.org/download/requirements/)

## Concrete distributions, with evidence limits

| Route | Official record inspected | Size | Local compatibility judgment |
|---|---|---:|---|
| `bpy` 4.5.6 Linux wheel | `bpy-4.5.6-cp311-cp311-manylinux_2_28_x86_64.whl` | 373,031,882 B | Architecture/glibc plausible; **CPython 3.11 ABI does not match current Python 3.12**. Do not force-install this wheel or relabel its tags. |
| Portable Blender 4.5.0 Linux | `blender-4.5.0-linux-x64.tar.xz` | 376,170,648 B | Separate application route avoids importing a CPython-3.11 wheel into the current interpreter. Actual linking, background startup, Cycles CPU availability and extraction size remain untested. |

These are pinned distributions found in official indexed records, not a claim that 4.5.0 is the newest suitable patch. The portable 4.5.0 entry is a concrete feasibility example; an installation decision should verify the intended supported patch and its official SHA-256 metadata first. No checksum was invented or treated as verified. [Official bpy 4.5.6 package record](https://pypi.org/project/bpy/4.5.6/), [Blender-hosted bpy index](https://download.blender.org/pypi/bpy/), [Official Blender 4.5 distribution index](https://download.blender.org/release/Blender4.5/)

Concrete archive URL derived from that indexed file entry:

`https://download.blender.org/release/Blender4.5/blender-4.5.0-linux-x64.tar.xz`

The official API documentation describes a precompiled pip module, rendering/3D conversion uses, and Python-module operation as broadly equivalent to background mode. That makes the intended native asset-authoring workflow reasonable in principle; it does not establish local package availability or execution. [Official Blender Python-module documentation](https://docs.blender.org/api/main/info_advanced_blender_as_bpy.html)

## First normal reachability result and permission boundary

The first official public-directory `web.open` request for `https://download.blender.org/release/Blender4.5/` returned **“Failed to fetch … (402) Payment Required.”** The three detailed documentation requests in the same independent batch also returned 402. Official search/indexed excerpts had succeeded before this batch.

The response does not identify whether 402 originated at the web retrieval service, an intermediary, or the publisher. Therefore it is **not** proof that Blender itself demands payment, that the archive is missing, or that an execution-host HEAD/GET would fail. No execution-host package HEAD/GET was made. In accordance with the explicit no-alternate-route instruction, the failed distribution host was not retried through curl, Python, a browser, another server or CI. `reachability.json` preserves the exact requested URLs and returned messages.

The turn's advertised execution-network allowlist does not list `download.blender.org`, `pypi.org` or `files.pythonhosted.org`. This is configuration evidence, not an observed package-download denial. No network exception, sandbox escalation or new connector was requested. The filesystem permits reversible work inside `/workspace/scratch/e72662e3b71f`; that alone does not supply an executable package or authorize bypassing network controls.

The parent explicitly scoped this unit as “インストール/大downloadはまだ行わず.” A later installation needs both an authorized normal route to the official distribution and a separate installation assignment from the parent. This is a task-scope boundary, not a request for new human confirmation. A portable workspace extraction should not need root/system-package changes, but this has not been executed. Do not solve a missing dependency with apt/system writes or an alternate host after a refusal.

## Proposed next finite unit, only once the normal prerequisite is available

1. Fetch the selected official release metadata/checksum and a single pinned Linux archive through the permitted ordinary route; verify byte size and SHA-256 before extraction. Keep archive, installation, configuration and output below a dedicated workspace directory. Budget roughly 2–3 GiB free space for archive plus extraction and temporary files as a **planning allowance**, not a measured installation size; current free space exceeds that allowance.
2. Check that binary's version and dynamic-library resolution; run a bounded background-only startup/import test. Then explicitly select Blender's native Cycles CPU engine. Stop on a dependency, permission or startup failure. Do not start a GUI/display server, software-WebGL surrogate, daemon, browser or preview server. CPU rendering support on this exact binary/environment remains to be established by that test.
3. Export one exact source actor/mesh into a standard asset interchange representation using its native indexed positions, normals, UVs and, where needed, a specified pose. Record source commit/hash and verify exported index/vertex/UV counts, coordinate transform and image SHA-256. Blender import cannot be assumed to preserve a game's custom Three.js shader; label any Principled/material translation explicitly. Do not silently bake a different pose, smooth normals or repair UVs in the comparison input.
4. Load the **unchanged original skin image** as the texture through the original UVs. Produce a few isolated model views at fixed model-camera/light/color-management settings, initially a small CPU render with bounded samples/time. Use them for texture placement, UV seams, geometry, normals and source-material inspection only. No full game scene, HUD, fabricated game pixels or screenshot comparison. Record Blender version, conversion settings and limitations alongside every image.
5. Verify original source/image hashes again and retain the `.blend`/asset export, script and metadata needed to reproduce the authoring inspection. Keep rendered evidence clearly labeled “offline Blender asset view, not the game.” Real WebGL shader compilation, game lighting/postprocessing, device performance and PS4 perception remain outside the evidence.

No source/runtime/media/remote files were modified, no new renderer was written, no new agents were spawned, and no candidate image was created in this unit. The compact capability report closes at the failed normal-read boundary; it does not declare a permanent impossibility or silently authorize a workaround.
