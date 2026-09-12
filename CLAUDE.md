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
`OffscreenCanvas`, no 3D textures, and hard-codes `getHardwareScalingLevel()`
to 1. Delete the harness afterwards.

Pictures come from headless Chrome. WebGPU there needs
`--enable-unsafe-webgpu --enable-features=Vulkan --use-angle=vulkan
--use-vulkan=swiftshader --use-webgpu-adapter=swiftshader --no-sandbox`, and
**real time** — under `--virtual-time-budget` it draws a frame or two and stops,
which looks exactly like a broken shader.

## How the app is put together

`src/main.ts` is the composition root and the **only** place systems are wired.
`GameRuntime.setSimulationStep()` takes a single function, so every system's
per-step update is called from that one closure. New system means a new line there.

`GameRuntime` owns the engine, the scene and the loop; nothing else creates them.
`FixedStepLoop` runs game logic at a fixed 60 steps per second and renders as
often as the browser allows. **All gameplay logic belongs in the simulation step**,
never in `runRenderLoop` and never tied to frame time.

`GameRuntime.setFrameUpdate` is the one exception, and it is presentation only:
once per drawn frame, after the steps, it places the camera between the last
two steps (`SmoothedEye`) and turns it by the mouse. Anything new the player
watches move smoothly at speed — a carried item, a mount — needs the same: record
its last two steps and draw between them, or it judders on any screen that is
not exactly 60 Hz.

The frame budget is **60 frames a second, 16.7 ms**. `AutoResolution` lowers the
resolution to as little as 70% while frames run slow; README "Frame rate" has
the measured costs of every pass.

Pause is pointer lock: the game is paused whenever the browser does not have the
mouse. The world map (`M`) uses the same rule — it lets go of the mouse to
pause, and hides the pause menu while it is open. Pausing freezes the simulation, keeps rendering, and resets the loop
accumulator so menu time does not replay as a burst of steps.

## Rules that fail silently if broken

**Import Babylon by deep path, never the package root.** `@babylonjs/core/scene`
is 700 KB; `@babylonjs/core` is 2.3 MB+. There are currently zero root imports —
keep it that way.

**Babylon features that need a side-effect import to exist at all.** Without them
the API is simply absent or does nothing, with no error and no warning. The four
in use:

| Import                                                            | Enables                                               |
| ----------------------------------------------------------------- | ----------------------------------------------------- |
| `@babylonjs/core/Collisions/collisionCoordinator`                 | `moveWithCollisions`                                  |
| `@babylonjs/core/Meshes/thinInstanceMesh`                         | every `mesh.thinInstance*`                            |
| `@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent`    | shadow maps rendering at all                          |
| `@babylonjs/core/Culling/ray`                                     | `scene.pickWithRay`, which otherwise throws           |
| `@babylonjs/core/Shaders/postprocess.vertex` (and `ShadersWGSL/`) | the vertex shader an `EffectWrapper` looks up by name |

**A material's effect and the effect a mesh is drawn with are different
objects.** `material.getEffect()` returns whatever was last bound, which is often
not the instanced variant the mesh actually uses. Check
`mesh.subMeshes[0].effect.defines` instead — reading the wrong one reported a
working shader plugin as missing.

**Picking needs a predicate here, always.** Everything solid in this game is
invisible, unpickable or both, and Babylon's default pick filter wants enabled,
visible _and_ pickable — only the ground passes. Pass
`(mesh) => mesh.checkCollisions && mesh.isEnabled()` and picking matches the
world the player collides with. **Given a predicate, Babylon stops checking
`isEnabled` itself**, while collision still does — leave it out and a house
hidden by distance stops a ray the player would walk straight through. A scratch scene also needs `StandardMaterial` imported or picking
degrades to bounding boxes: hits come back with `faceId -1` and no `pickedPoint`.

**Never send a whole instance buffer when part of it changed, and never one run
from the lowest changed index to the highest.** On a torus-shaped buffer that
run becomes the whole buffer whenever the change crosses the wrap-around: the
grass sent 12.8 MB a step that way, 846 MB a second at a sprint, and it was the
game's worst stutter. Store by blocks and send each changed block
(`grassSlots.ts`).

**A render target culls nothing.** A `RenderTargetTexture` with no mesh list
draws every enabled mesh on its camera's layers, however far outside its view.
Give it `renderListPredicate` with a frustum test (`ViewBoxFilter`).

**Ground mist finds Babylon's fog line by its exact text.** `HeightMistPlugin`
replaces `float fog=CalcFogFactor();` (GLSL) and `var fog: f32=CalcFogFactor();`
(WGSL) through a plugin key starting with `!`, which Babylon applies as a
regular expression after its includes are expanded. If a Babylon update
rewrites that line the mist silently stops: the shader compiles and nothing
matches. Check the mist after upgrading Babylon.

**Detaching `VolumetricLightScatteringPostProcess` does not stop its occlusion
pass**, which lives in `camera.customRenderTargets`; take it off that list too.
And **an effect layer's `camera` option does not stop it being merged onto
every camera's picture**: switch `isEnabled` before each camera draws. Both
passes redraw the whole world, silently, for nothing on screen.

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

**Every custom shader is written twice, GLSL and WGSL.** The engine picks
WebGPU wherever the browser has it. Babylon can translate GLSL for WebGPU, but
only by downloading two compilers from its servers at run time — so the sky's
shaders exist in both languages, line for line alike, and a change to one is a
change to both. A material plugin must also say it speaks WGSL
(`isCompatible`), or on WebGPU it **silently does not attach**; the tree wind
is GLSL-only and is off on WebGPU for exactly that reason.

**`RegisterMaterialPlugin` only reaches materials created after it.** The cloud
shadows are registered at the top of `main.ts`, before the terrain; register
later and everything already built has no shadows, with no error.

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
torus, so moving it rewrites only the blocks that entered it, and blades are
stored block by block so every change goes to the GPU as a few short runs
(`grassSlots.ts`). The breeze animates the **shared blade mesh**, so all
instances move for free; per-blade wind would need a vertex shader. Grass only
bends for meshes registered with `addPusher()`.

**The mini-map is not a camera on the list.** It draws into its own texture 20
times a second (`MiniMapPicture`) and that picture is laid into the corner of
every frame. `scene.activeCameras` holds only the view, and the code that
means "the view" reads `activeCameras[0]`.

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

**The drawn ground is not the grid.** It is a tree of patches
(`terrain/patches/`), full detail near the player and coarser further off,
built and thrown away as they move. A coarse patch can stand metres off the
true ground, so nothing may read heights from a ground mesh, and nothing may
hold one: ask `HeightGrid`. A patch is only ever swapped for its quarters, or
they for it, once the replacement is built — change that and holes open. Edges
between levels are covered by skirts hung from every patch; a patch built
without them shows the sky through the seam.

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
fog and far plane interact: fog is linear and finishes at the render distance,
never past 1200 m, inside the fixed 1400 m far plane; and the sun and moon are
placed 1,390 m out relative to the **player**, with `fogEnabled = false`, or
walking a kilometre swings them across the sky. Do not tie the far plane to the
render distance — it would cut the sun off.

**Render distance decides what exists** (`WorldStreaming`). Babylon's fog is
radial, so past the render distance nothing can be seen in any direction, and
nothing is kept there: no ground, no stones, trees and houses switched off.
Stones exist only within 250 m and are rebuilt identical from their shapes;
house trim is hidden past 150 m. **What holds state is disabled, never
disposed** — a door left open must still be open when the player walks back.
Anything built and disposed as the player moves must come off the god-ray skip
list (`SunGodRays.forgetExcluded`), which is searched for every mesh, every
frame. A new teleport must call `WorldStreaming.prime` or it lands the player
among stones not built yet.

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

**The sky is three spheres round the eye, at fixed distances**
(`src/world/sky/`): the sky at 1,398 m, the sun and moon at 1,390 m, and the
veil the clouds are laid in at 1,300 m, all inside the 1,400 m far plane. That
order is what puts a cloud in front of the sun and behind a mountain; move any
one of them and a cloud goes behind the sun or in front of the land. The domes
must stay out of the glow layer and the god-ray pass, or they black the sun
out of both — and the halo, being added after the picture is finished, is
dimmed by hand (`CelestialGlow`) or it shines through overcast.

**Clouds are traced at reduced resolution into a target, then laid in.** The
march (`CloudPass`) runs before the scene is drawn, for the first active
camera, and blends into the last frame by camera rotation alone — valid only
because clouds are kilometres away. Their shadows are a plugin on every
standard material that dims directional lights only. **The shadow shader and
`cloudShadeAt` are one formula in two places**: if they disagree, the halo
dims where no shadow falls. Weather runs on **real seconds**; a game day is
twenty minutes.

**The sky is painted in the simulation step, and the step does not run while
paused** — which is whenever the menu is open, and from the moment the game
loads until the first click. `Sky` paints once when built; anything that moves
the clock from the menu must call `sky.repaint()`, or the sun and the light
move and the sky's colour, halo and stars stay behind until the player resumes.

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

**Every rock is two meshes**, built only near the player: a smooth one to look
at, with no collision, and an invisible upright prism to bump into
(`createRockCollider.ts`) — plumb sides, level top, no material. A smooth rock made a bad solid: the solver slides the
player along a curved face, downward, and with the ground out of the solver
nothing caught them, so they sank under the stone's edge and were trapped.
Stones are grown up from the ground under each vertex, so their rim is buried on
every side of a slope and no gap shows under them.

**Grass keeps out of objects by their real shape, never by a rectangle**
(`GrassBlocker`): a stone's outline where it leaves the ground, a trunk's
circle, a house's walls, each fading grass back in over 35 cm. Anything new
that stands on grass needs a blocker, or blades grow up through it.

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

**Time is one number.** `TimeOfDay` holds the hours since midnight on 1 January,
Year 1, and never wraps. The date, the season, the sun's yearly path, the moon's
phase and the stars are all worked out from it (`src/world/calendar/`). Never
keep a second count of days or seasons: it will drift. The calendar is the real
one — real months and lengths, 365 days, no leap years, seasons as whole months
(spring is March to May). A game day is 20 real minutes; the game opens at 10:00
on 1 March.

**The weather is a function of time** (`src/world/weather/`): worked out
afresh every step from the date and hour, never stored, so the same moment
always has the same weather — which is what makes a forecast and a save
possible. Never keep weather state that the date cannot rebuild. `dayPlans.ts`
decides each day from Kyiv's records (a wet/dry Markov chain, bright or grey
skies, rain spells, fog and mist mornings, purple days); `Weather` blends the
hours and hands its state to everything registered with `addListener` in
`main.ts` — sky colour, clouds, fog, trees, grass, smoke. Anything new the
weather should change implements `setWeather(state)` and is added there. After
the menu moves the clock or holds a weather, `SettingsBinder` runs
`weather.update`, `dayNight.refresh` and `sky.repaint`, because no step runs
while paused.

**Sun and moon are real astronomy** (`celestialPath.ts`, `calendar/solarYear.ts`):
latitude 45 degrees, the sun highest at 13:00 all year, day length following the
date. Sky colours are two keyframe tables in `timeOfDayKeyframes.ts`, keyed by
**the sun's height, not the hour** — a winter sunset is at 17:17 — and blended
from the morning table to the evening one across the day. Edit the tables, not
the code that reads them.

**Settings are one-way**: the menu writes `settingsStore`, `SettingsBinder` pushes
into the running game, nothing writes back. Bump `STORAGE_KEY` when a default
changes in a way a saved file must not override.

## Layout

```
src/core/      engine, fixed-step loop, stats, inspector
src/scenes/    scene factories
src/world/     grass, clock, day/night, sun and moon, shadows, the world's edge
src/world/terrain/  the island's height grid, sea, and rivers/
src/world/terrain/patches/  the drawn ground's levels of detail
src/world/sky/      the sky, the clouds, their weather and their shadows
src/world/calendar/ the calendar, the sun's path through the year, the climate
src/world/weather/  the weather: what each day brings, and what it does to the sky and air
src/world/rocks/    loose stones
src/player/    the bean, its camera, controls, collisions, footing, head bob
src/minimap/   the second camera and its overlay decorations
src/ui/        React overlay + the bridge
src/settings/  settings store and the binder into the game
```

`README.md` is the deep documentation: measured costs, tuning constants, why each
number is what it is, and the traps already hit. Read it before changing a system,
and update it when behaviour changes.
