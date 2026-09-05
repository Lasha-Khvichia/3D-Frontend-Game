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

| Import                                                         | Enables                      |
| -------------------------------------------------------------- | ---------------------------- |
| `@babylonjs/core/Collisions/collisionCoordinator`              | `moveWithCollisions`         |
| `@babylonjs/core/Meshes/thinInstanceMesh`                      | every `mesh.thinInstance*`   |
| `@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent` | shadow maps rendering at all |

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

**Grass** (`src/world/GrassField.ts`) is 200,704 thin instances of one 5-vertex
mesh in one draw call. Never rewrite all transforms in a frame — the patch is a
torus, so moving it rewrites only the rows and columns that entered it, uploaded
with `thinInstancePartialBufferUpdate`. The breeze animates the **shared blade
mesh**, so all instances move for free; per-blade wind would need a vertex shader.
Grass only bends for meshes registered with `addPusher()`.

**Houses are built from code, not loaded** (`src/world/houses/`). A house is
rows of solid boxes with the openings left out, under a roof that carries no
collision. That shape is deliberate: boxes are thick enough that a sprinting
player cannot cross one between two steps, and have no sloped face for the
solver to slide the player up. Downloaded glTF houses failed on both counts, and
that is why they were removed. Keep walls at least 0.2 m thick and never put
collision on anything sloped.

**The village is phased.** Phase 0 (done) is bare shells. Phase 1 (done) is
stone and timber on the walls, placed on the wall segments so it can never cover
an opening, seeded from each house's name so the village never changes between
loads. Phase 2 is working doors and shutters, opened by walking into them or
with `E`, barred from inside with `F`. Phase 3 is fireplaces, chimneys, fire and
smoke. Each phase builds on `houseShapes.ts` and
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
