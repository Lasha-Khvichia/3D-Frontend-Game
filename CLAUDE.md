# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this game is

A 3D fantasy game in the spirit of Stardew Valley: farming, building, seasons,
villagers and a day/night cycle, played in first person in a browser rather than
top-down in 2D.

None of that gameplay exists yet. What is built so far is the world it will run
on — ground, grass, sky, sun and moon, a player who walks and jumps, and the loop
and settings around them. Treat new work as foundations for a long,
systems-heavy game, not as one-off scenes.

## Commands

| Command                | What it does                          |
| ---------------------- | ------------------------------------- |
| `npm run dev`          | Dev server on http://localhost:5173   |
| `npm run build`        | `tsc --noEmit`, then production build |
| `npm run typecheck`    | Type check only                       |
| `npm run format`       | Prettier write                        |
| `npm run format:check` | Prettier check                        |

**There is no test runner and no ESLint.** `npm run build` plus `npm run format:check`
is the whole automated gate. Do not invent `npm test`.

To verify game behaviour without a GPU, build a throwaway harness with
`vite build --ssr` and run it in Node against Babylon's `NullEngine`. Two traps:
output the bundle **inside the project directory** or Vite externalises
`@babylonjs/core` and Node cannot resolve it, and NullEngine has no `_gl`, no
`OffscreenCanvas`, and hard-codes `getHardwareScalingLevel()` to 1. Delete the
harness afterwards.

## How the app is put together

`src/main.ts` is the composition root and the **only** place systems are wired.
`GameRuntime.setSimulationStep()` takes a single function, so every system's
per-step update is called from that one closure. New system means a new line there.

`GameRuntime` owns the engine, the scene and the loop; nothing else creates them.
`FixedStepLoop` runs game logic at a fixed 60 steps per second and renders as
often as the browser allows. **All gameplay logic belongs in the simulation step**,
never in `runRenderLoop` and never tied to frame time.

Pause is pointer lock: the game is paused whenever the browser does not have the
mouse. Pausing freezes the simulation, keeps rendering, and resets the loop
accumulator so menu time does not replay as a burst of steps.

## Rules that fail silently if broken

**Import Babylon by deep path, never the package root.** `@babylonjs/core/scene`
is 700 KB; `@babylonjs/core` is 2.3 MB+. There are currently zero root imports —
keep it that way.

**Babylon features that need a side-effect import to exist at all.** Without them
the API is simply absent or does nothing, with no error and no warning. The four
in use:

| Import                                                         | Enables                                     |
| -------------------------------------------------------------- | ------------------------------------------- |
| `@babylonjs/core/Collisions/collisionCoordinator`              | `moveWithCollisions`                        |
| `@babylonjs/core/Meshes/thinInstanceMesh`                      | every `mesh.thinInstance*`                  |
| `@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent` | shadow maps rendering at all                |
| `@babylonjs/core/Culling/ray`                                  | `scene.pickWithRay`, which otherwise throws |

**A material's effect and the effect a mesh is drawn with are different
objects.** `material.getEffect()` returns whatever was last bound, which is often
not the instanced variant the mesh actually uses. Check
`mesh.subMeshes[0].effect.defines` instead — reading the wrong one reported a
working shader plugin as missing.

**Picking needs a predicate here, always.** Everything solid in this game is
invisible, unpickable or both, and Babylon's default pick filter wants enabled,
visible _and_ pickable — only the ground passes. Pass
`(mesh) => mesh.checkCollisions` and picking matches the world the player
collides with. A scratch scene also needs `StandardMaterial` imported or picking
degrades to bounding boxes: hits come back with `faceId -1` and no `pickedPoint`.

**`thinInstanceGetWorldMatrices()` caches its answer.** Reading it before and
after a change returns the first snapshot twice and reports that nothing
happened. Read it once, after the change.

**Babylon winds its front faces the opposite way to the usual right-handed
rule.** Measured against `CreateBox`: on all twelve of its triangles the cross
product of the wound edges points _into_ the box. Hand-built geometry wound the
other way is invisible from the side you want and solid from the side you do
not, with no error. If you write raw `VertexData`, check it against a box.

**A single sheet of geometry has no back.** A wall is a solid box so its inside
face renders normally, but a roof is one surface: without
`backFaceCulling = false` you stand inside and see sky through it. Leave
`twoSidedLighting` off — it is physically right and looks wrong, because nothing
shines up at a ceiling and the underside comes out pure black.

**React and the game talk only through `src/ui/bridge.ts`,** one way: the game
publishes stats, React sends commands. React state must never be written at frame
rate — the mini-map decoration canvas is deliberately passed through the bridge
as a raw element and painted by the render loop for exactly that reason.

**`moveWithCollisions` reads the mesh's world matrix, not `mesh.position`.** The
simulation step runs before the render, so call `computeWorldMatrix(true)` first
or gravity pushes the player upward and walls stop working.

**Any camera that writes `rotation.z`, or looks straight down, needs
`updateUpVectorFromRotation = true`.** Babylon otherwise refreshes the up vector
only when `rotation.z` changes. Both the player camera and the mini-map camera
set it.

## Systems worth knowing before you touch them

**Trees** (`src/world/trees/`) are grown from code, not loaded. A `Leaf` and a
`Branch` are entities but own no mesh: each is a handle onto one slot in a shared
thin-instance buffer, which is what lets 53,600 leaves stay addressable while a
canopy is one draw call. Ids are getters, never stored fields. Collision is one
merged invisible shell per tree — upright boxes within reach, boxes lying along
the wood above it, and never a tilted collider low down or the tree becomes a
staircase.

**Tree canopies have three detail tiers** (`src/world/trees/treeDetail.ts`) by
distance. Thinning a canopy always scales the remaining leaves by 1/sqrt(share),
or distant trees look bare rather than distant. A tier change rewrites the whole
canopy, so `Woodland` allows only one per step. Only trees within 32 m are in the
shadow map; the box is 48 m, so the rest cast nothing visible.

**Making a Babylon mesh is expensive.** Building geometry as many meshes and
merging them cost 16 of the 23 ms a tree took. Stamp one template's vertices into
raw arrays instead — see `collideTree.ts`.

**Tree wind is a material plugin** (`src/world/trees/WindMaterialPlugin.ts`) on
the standard material, so lighting, shadows and fog keep working. It is GLSL, so
it disables itself on a WebGPU engine rather than breaking every tree material.
Leaf and wood strengths must keep the same bend and sway or leaves slide off
their twigs.

**`WorldEntity`** (`src/core/WorldEntity.ts`) is the base every world object
shares: an `id` getter and `dispose`, and deliberately **no `update`**. Every
system needs different context to advance, and forcing one signature on all of
them is the rigidity a shallow base exists to avoid.

**Grass is two patches** (`src/world/Meadow.ts`), dense underfoot and sparse to
the horizon, both running `GrassField` with different numbers from
`grassLayout.ts`. One patch cannot do both: dense grass must stay small, and a
small patch ends in a hard edge with bare ground beyond it.

**Grass** (`src/world/GrassField.ts`) is 200,704 thin instances of one 5-vertex
mesh in one draw call. Never rewrite all transforms in a frame — the patch is a
torus, so moving it rewrites only the rows and columns that entered it, uploaded
with `thinInstancePartialBufferUpdate`. The breeze animates the **shared blade
mesh**, so all instances move for free; per-blade wind would need a vertex shader.
Grass only bends for meshes registered with `addPusher()`.

**The scene is at its light budget: 4.** Ambient, sun, moon, and the single
firelight that moves to whichever hearth the player is nearest. A standard
material only considers four at once, so a fifth light would silently stop one
of the others being used. Move the shared light rather than adding another.

**A merged mesh comes back with its world matrix frozen.** Right for scenery,
wrong for anything hung on a hinge: frozen means the parent can turn all it
likes and the mesh will not follow, with no error. Call `unfreezeWorldMatrix()`
after parenting a merged mesh to something that moves.

**Houses are built from code, not loaded** (`src/world/houses/`). A house is
rows of solid boxes with the openings left out. That shape is deliberate: boxes
are thick enough that a sprinting player cannot cross one between two steps, and
have no sloped face for the solver to slide the player up. Downloaded glTF
houses failed on both counts, and that is why they were removed. Keep walls at
least 0.2 m thick.

**Collision is never put on a sloped face except one: the roof.** The roof mesh
is a single sheet and stays uncollidable; `collideRoof.ts` puts an invisible
solid wedge behind it — the loft, eight triangles. A staircase of upright boxes
was tried there and is wrong: **the player's collision ellipsoid is 0.4 m in
radius, so on centimetre steps it rests on corners rather than faces**, which
slides it down the roof and wedges it between steps. A sloped collider is only
safe because the wedge's lowest point is the wall top, 2.4 m up, out of reach of
a 1.11 m jump and a 2.0 m climb. Anything reachable on foot must still be boxes.

**Nothing pushes the player sideways unless the player asked.** The solver has
no friction, so gravity on a slope slides you. `PlayerController` restores x and
z after a move that was grounded and had no horizontal input.

**The village is phased.** Phase 0 (done) is bare shells. Phase 1 (done) is
stone and timber on the walls, placed on the wall segments so it can never cover
an opening, seeded from each house's name so the village never changes between
loads. Phase 2 (done) is working doors and shutters in
`src/world/openings/`: doors open by walking into them, `E` works shutters, `F`
bars a door from inside or bolts a window. Phase 3 (done) is fireplaces, chimneys, fire
and smoke, in `src/world/fire/`. Each phase builds on `houseShapes.ts` and
`houseBlueprint.ts` rather than replacing them.

**Sun and moon are real astronomy** (`celestialPath.ts`), on separate clocks.
Colours are a keyframe table in `timeOfDayKeyframes.ts` — edit the table, not the
code that reads it.

**Settings are one-way**: the menu writes `settingsStore`, `SettingsBinder` pushes
into the running game, nothing writes back. Bump `STORAGE_KEY` when a default
changes in a way a saved file must not override.

## Layout

```
src/core/      engine, fixed-step loop, stats, inspector
src/scenes/    scene factories
src/world/     ground, grass, clock, day/night, sun and moon, shadows
src/player/    the bean, its camera, controls, collisions, head bob
src/minimap/   the second camera and its overlay decorations
src/ui/        React overlay + the bridge
src/settings/  settings store and the binder into the game
```

`README.md` is the deep documentation: measured costs, tuning constants, why each
number is what it is, and the traps already hit. Read it before changing a system,
and update it when behaviour changes.
