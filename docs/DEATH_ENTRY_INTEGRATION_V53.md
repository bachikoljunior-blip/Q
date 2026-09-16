# Death-entry integration v53 — 2026-09-16

The player keeps the last live articulated pose during the first 0.24 seconds of death, then reaches the existing supported corpse pose. A previously hidden weapon starts from its canonical displayed orientation; restoring its invisible healing orientation would drive the spear underground. This correction is adopted after a fresh independent failure and repair, not by reusing the lost v40 result.

## Source and evidence

Base is PR52 `7fbe77e63b2172a8d9cde4c8953858d02fdefe0d`, tree `901eaf7710af58ba9a331a3db85a4470da1d4d2f`. Actor author `e58994a182cfac8714d12f89d9ab9244ce0e4ed5` was integrated as `b3e354afeea7afd899864b9fc5f13412ed20c708`. Final actor source SHA256 is `ee276f96ac89769f9f3c57c146f85c06af7efd429623b0ab85a46bf51acaa84b` (38,244 B). Geometry, media, Game rules and save state are unchanged. Cache invalidation covers a different player, alive reset, equipment changes, explicit death clocks and first-seen corpses. The exact one-second corpse endpoint is preserved.

The [author and independent evidence](evidence/death-entry-recovery-v52/) retain the rejected hidden-spear source and its failure. Independent actual-Game healing, jumping and naturally vulnerable dodge-tail death cover 27 cases at 30/60/120 Hz with three weapons. All 27 reduce the movement of vertices continuously visible across death entry: maximum healing 1.020729 to 0.223692 m, jump 1.690190 to 0.075299 m, dodge 0.918017 to 0.298967 m. Previously hidden-to-shown geometry is separate: its healing union maximum increases 3.323408 to 3.956738 m and is not a displacement of previously visible pixels. After the visibility repair, sampled skin/rigid/cape minima are +1.698/+24.624/+11.986 mm and no sampled vertex penetrates the ground. The one-second canonical result and Game/serialized state are exact.

The author 36-condition comparison reduces the initial entry jump but increases later maximum steps at 30/60/120 Hz from 0.249507/0.124843/0.062453 m to 0.864796/0.443720/0.222008 m. This redistributes the initial discontinuity; it does not prove natural motion or improvement of every frame. Existing airborne death still freezes the player root up to 1.094167 m above ground here. v55 is a separate core/main repair under independent review. CPU timing is noisy; no speedup or real device result is claimed.

## Fresh combined verification

All 27 required commands and 333 tests passed in 143.4932269819983 seconds. [Raw logs](evidence/death-entry-integration-v53/validation/validation.json) and [exact artifact metadata](evidence/death-entry-integration-v53/integration.json) are preserved. The optional standalone package and its two tests also passed.

The fixed normal stage `artifacts/site-rduKHp` contains 34 files / 14,037,148 B. Initial JS stays 165,415 B / three JS files; deferred code grows 1,714 B. All 27 media files / 12,883,257 B are unchanged byte for byte from PR52. Source fingerprint is `sha256:0f351bc73d994ebfb6b2eb0f02fda7b53ebb3486d1cf547da53f5c4fb97f7f07`; receipt SHA256 is `4b33d5a843756f80a8998cb3d486f58183886cc5e7ba5e7c007720593374a646`. Optional HTML is 17,309,822 B, SHA256 `981defd03a8f4927284bd3b246f347d80645b753ce5f96f02d83d01cdd689fcc`. The fixed stage passes full source/reference/byte validation; unreferenced stale files in an earlier author dist were not delivered.

## Production decision and continuation

PR52 audio is durably preserved at `7fbe77e63b2172a8d9cde4c8953858d02fdefe0d`, and required CI run 35077524542 succeeded. This v53 unit is next in the normal stack. Main remains `547676fdce8d8e97abed9f065aad0b6e24af2fd6`, PR39 is open/unmerged, and owner-only Site23 is unchanged. No repeated merge mutation after the recorded timeout, no feature merge, no unmerged Site delivery. Retarget and run required CI in predecessor order only after real main progress.

September 20 PS4 whole-screen completion remains unsupported by actual visual/listening/device/reference evidence and delivery latency. The recreated official preview still reports its supervisor mailbox unavailable; no alternative server/browser or human preparation is used. Numerical geometry and Node boundaries are not WebGL pixels.

The v54 Mira body candidate was compared through actual dialogue camera projection at 1280x720, 844x390 and 390x844. Visible torso changes reach only 0.02069 pixels, sleeves 1.313 pixels, with triangle-pair substitutions and some API stress crossing increases. The candidate runtime is rejected as an inadequately evidenced visible improvement; its study will be preserved separately. This directly questions the premise that source-anatomy edits necessarily improve the presented character. Next finite useful work is v55 airborne settling with blur/pagehide pause repair, while revising visible-material/silhouette production using actual camera and occlusion conditions. No claim of reaching PS4 quality, natural motion, measured GPU/RAM or perceptual parity is made.
