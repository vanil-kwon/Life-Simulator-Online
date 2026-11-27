# Mobile 3D Asset & Performance Budget

## Target

Xiaomi Redmi 14C, 4 GB RAM, Chrome Android, WebGL. Design for memory pressure: the browser, Android and other apps share physical memory. Do not treat all 4 GB as available to the game.

## Visual quality strategy

Aim for realistic shapes, materials and animation rather than expensive real-time effects:
- Human: one optimized rigged character, shared skeleton animation clips, limited material slots.
- Vehicles: baked details, modest polygon count, simple collision proxies, no real-time reflections.
- Buildings: modular facade pieces, trim sheets/atlases, repeated window meshes instanced where possible.
- Interiors: load only when entering; unload when leaving.
- Lighting: hemisphere + one directional light, baked textures/AO where available; realtime shadow maps disabled on the baseline profile.
- Materials: physically based roughness/metalness maps, but keep texture sizes modest and reuse materials.

## Runtime rules

- Baseline pixel ratio: 1.0; only raise after device profiling.
- Render target: 30 FPS; prefer consistent frame pacing over visual effects.
- Avoid post-processing, large render targets, high-resolution shadow maps and large transparent particle systems.
- Use frustum/distance culling, LODs, instancing, object pooling and capped delta time.
- Load assets asynchronously and progressively; do not preload all districts.
- Detect WebGL context loss and show a recoverable reload message.
- Add a low-memory mode that reduces render scale, texture variants and active NPCs.

## Asset sourcing and licensing

Potential sources: Quaternius, Kenney, Poly Haven. These are source libraries, not automatic permission for every item: verify the exact asset page, license, attribution and redistribution terms before inclusion. Prefer CC0 assets. Track every shipped asset in an asset manifest.

## Validation checklist

- [ ] Vite production build succeeds in GitHub Actions.
- [ ] First load completes without console errors in Chrome Android.
- [ ] No WebGL context loss during a 10-minute session.
- [ ] Touch controls work without page scrolling or accidental zoom.
- [ ] Measure FPS, memory pressure and thermal throttling on the actual Redmi 14C.
- [ ] Keep baseline at 30 FPS target; reduce quality if frame pacing is unstable.

Performance targets are design constraints, not measured claims until tested on the physical phone.
