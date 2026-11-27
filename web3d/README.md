# Life Simulator 3D — Realistic Mobile Web Prototype

Target device: Xiaomi Redmi 14C with 4 GB RAM. Runtime: Chrome on Android, Three.js / WebGL. This is a browser game, not a Unity APK.

## Visual direction

The target is a grounded, realistic modern-life-simulator look: believable human proportions and animation, detailed but compact vehicles, convincing building facades and apartment interiors, and natural day/evening lighting. The current primitive character, buildings and car are greybox placeholders, not final art.

Use licensed game-ready GLB/GLTF assets where practical. Prefer CC0 sources (for example Quaternius, Kenney and Poly Haven); verify the individual asset's license and attribution requirements before committing or shipping it. Keep a small asset manifest with source, author, license, download date and any required attribution.

## Redmi 14C 4 GB performance profile

- Mobile-first WebGL renderer; antialiasing off and low-power preference.
- Cap device pixel ratio at 1.0 by default; allow a tested 1.25 quality option only if frame pacing permits.
- No real-time shadow maps by default. Use baked ambient occlusion/lightmaps or simple blob/contact cues.
- Use compressed textures (KTX2/Basis where supported), sensible texture atlases and mipmaps.
- Keep visible district compact; use frustum/distance culling, instancing for repeated props, and LODs for vehicles/buildings.
- Limit active animated NPCs and update distant simulation less often.
- Load GLB assets on demand; avoid loading the entire city and all interiors at startup.
- Provide a low-memory fallback: smaller texture variants, fewer NPCs, reduced render scale and no post-processing.
- Initial performance goal: stable 30 FPS, measured on the actual Redmi 14C before increasing scene complexity. This is a target, not a verified result.

## Current prototype

- Third-person camera and touch movement/look.
- Small procedural city block and placeholder player/car.
- Health, energy and hunger HUD.
- Build and deploy through GitHub Pages after the PR is merged.

## Next implementation order

1. Integrate one optimized, licensed humanoid GLB and a small set of walk/idle animations.
2. Add a compact realistic vehicle GLB with low-cost interaction.
3. Replace selected building placeholders with modular facade/interior assets.
4. Add a small apartment interior with on-demand loading.
5. Profile on Redmi 14C; only then expand NPC count, district size and visual effects.

This is an early prototype, not a finished realistic game. Physical-device testing remains required.
