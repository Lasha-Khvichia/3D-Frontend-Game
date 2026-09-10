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
**Never judge winding from a screenshot.** An inside-out convex shape has the
same outline as a solid one and reads as solid by eye — every loose stone was
drawn inside out for two rounds after a winding was "fixed" by looking. Put a
red, unlit ball inside the shape and render it: the ball shows through only
when the winding is wrong.

**A single sheet of geometry has no back.** A wall is a solid box so its inside
face renders normally, but a roof is one surface: without
`backFaceCulling = false` you stand inside and see sky through it. Leave
`twoSidedLighting` off — it is physically right and looks wrong, because nothing
shines up at a ceiling and the underside comes out pure black.

**React and the game talk only through `src/ui/bridge.ts`,** one way: the game
publishes stats, React sends commands. React state must never be written at frame
rate — the mini-map decoration canvas is deliberately passed through the bridge
as a raw element and painted by the render loop for exactly that reason.

**Babylon collides with both sides of every face on a mesh that has a
material.** `AbstractMesh` passes `!!subMesh.getMaterial()` as "test back faces
too", so a player who gets inside a visible mesh finds a wall in every direction
and cannot move — and sees straight through it, because inside faces are not
drawn. Colliders here are invisible and **carry no material**, which makes them
one-sided: from inside, every way is out. Give a collider a material and that
safety is gone, with no error.

**Never set the player's height directly.** Anything that moves them up or down
— the terrain lift, the downhill snap — goes through `moveWithCollisions`, and
if something stops that move short, the feet stay where it left them. Setting
`position.y` onto the ground drops the player through whatever lies in between;
that is how half of all walks into a stone ended inside it.

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

**The island is one height function sampled once into a grid**
(`src/world/terrain/`). Nothing reads the function after that: the mesh, the
player's feet, the grass, the trees and the stones all read `HeightGrid`, which
splits each cell along the same diagonal the mesh does. Read the function
instead and feet sink into hillsides or hover over them.

**The ground is not a collision mesh.** The player is lifted onto the grid after
every move (`src/player/terrainFooting.ts`), and the slope limit, wading and
deep-water stop are rules on the grid (`fitMoveToGround.ts`). Putting the ground
back into Babylon's solver brings back getting stuck and invisible walls: the
solver resolving the player against the ground and a rock at once finds no way
out of the crease between them. Collision meshes are houses, trees, stones and
bridges only. Anything that picks the floor with a ray will find nothing — see
how `findLedge` falls back to `ground.heightAt`.

**Settlements sit at exactly y = 0 and the sea is at -2.5**, not the other way
round. Every house was built assuming a floor at zero; the terrain flattens each
settlement's ground to zero and eases relief away around it. Each settlement is
also unioned into the coastline, because the coast is noise. The ground's size,
fog and far plane interact: fog is linear and finishes inside the 1400 m far
plane, and the sun and moon are placed relative to the **player**, with
`fogEnabled = false`, or walking a kilometre swings them across the sky.

**Rivers are cut into the grid before any mesh is built**
(`src/world/terrain/rivers/`), and only ever lower it. Three rules hold the
water in its channel, and each was a visible bug without it: the level is the
running minimum of the ground **across the whole width** (down the centre line,
a river on a slope floats over its downhill bank); the water may fall **at most
7 degrees** (or it leaves a spring as a tilted sheet); and each edge of the water
sheet **steps out until it meets dry ground** (a 4 m grid dips below the water
just past the channel). The river surface between grid points is **blended,
never the nearest sample** — nearest jumped half a metre per step and tripped
the wading limit in mid-stream. Crossings are a share of the river's length
**on land**. Springs are separate rock plus an unlit black block, because a
height map cannot hold a cave, and must start on level ground or the arch ends
up in a trench.

**The overview camera lies about the island.** From kilometres up with a 0.1 m
near plane, the depth buffer cannot separate land from the sea 2.5 m below it
and the sea bleeds through as blue patches. That is the camera, not flooding —
check heights numerically before "fixing" the terrain.

**Every inhabited place is in `settlements.ts`**: the village on its street and
five hamlets of three cottages. Hamlet houses are not cheaper copies — same
`buildHouse`, same doors and fires. Each settlement carries a `clearance`, and
that is the only way the terrain knows to lay level ground for it and the stone
scatter knows to keep off it.

**Houses are built from code, not loaded** (`src/world/houses/`). A house is
rows of solid boxes with the openings left out. That shape is deliberate: boxes
are thick enough that a sprinting player cannot cross one between two steps, and
have no sloped face for the solver to slide the player up. Downloaded glTF
houses failed on both counts, and that is why they were removed. Keep walls at
least 0.2 m thick.

**Sloped collision meshes are safe because of the slope limit.** The roof is a
solid wedge behind a sheet that carries none, and stones are one smooth mesh
that is both what you see and what you hit. `standableGround.ts` casts one ray
down and refuses anything past 48 degrees on meshes, as the grid slope does on
the ground; too steep is _not ground_ rather than blocked. Roofs are 37 degrees
and must stay under the limit. A staircase of small boxes is wrong for any
slope: **the player's ellipsoid is 0.4 m in radius, so on centimetre steps it
rests on corners rather than faces**, and slides and wedges between them.

**Babylon's solver has no step.** Sliding along a vertical face removes all the
forward motion, so a 6 cm lip stops a sprint dead. `stepOver.ts` retries a
blocked move from 0.4 m up, and that retry must only land somewhere
`isStandable` agrees with, or it becomes a way to stair-step up a rock face.

**Every rock is two meshes**: a smooth one to look at, with no collision, and
an invisible upright prism to bump into (`createRockCollider.ts`) — plumb sides,
level top, no material. A smooth rock made a bad solid: the solver slides the
player along a curved face, downward, and with the ground out of the solver
nothing caught them, so they sank under the stone's edge and were trapped.
Stones are grown up from the ground under each vertex, so their rim is buried on
every side of a slope and no gap shows under them. Grass is kept off the stone's
body only; its low skirt carries no collision, so grass may cover it.

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
src/world/     grass, clock, day/night, sun and moon, shadows, the world's edge
src/world/terrain/  the island's height grid, sea, and rivers/
src/world/rocks/    loose stones
src/player/    the bean, its camera, controls, collisions, footing, head bob
src/minimap/   the second camera and its overlay decorations
src/ui/        React overlay + the bridge
src/settings/  settings store and the binder into the game
```

`README.md` is the deep documentation: measured costs, tuning constants, why each
number is what it is, and the traps already hit. Read it before changing a system,
and update it when behaviour changes.
