# Game

Babylon.js 9 on Vite + TypeScript. React renders a DOM overlay above the canvas
and never touches the render loop.

## Controls

| Input                     | Action                                              |
| ------------------------- | --------------------------------------------------- |
| Click the canvas          | Lock the mouse and look around                      |
| `W` `A` `S` `D` or arrows | Walk                                                |
| Mouse                     | Turn the body, tilt the view                        |
| `C`                       | Swap between the player's eyes and the orbit camera |
| `Esc`                     | Release the mouse                                   |

## Pause and settings

**The game is paused whenever the browser does not have the mouse.** Escape
releases it in every browser and cannot be intercepted, so the key players press
anyway is the one that works. Resume, or a click anywhere on the world, takes it
back.

Pausing freezes the simulation and keeps rendering, so the world stays on screen
behind the menu. The fixed-step accumulator is reset on pause, or the time spent
in the menu would replay as a burst of steps on resume.

There is no pause in the orbit view (`C`), because the mouse is free there by
design.

| Setting              | Effect                                                   |
| -------------------- | -------------------------------------------------------- |
| Field of view        | 55 to 100 degrees, vertical                              |
| Mouse sensitivity    | 0.25x to 3x                                              |
| Head bob             | 0 to 100 percent of the bounce                           |
| Invert vertical look | flips the mouse                                          |
| Time of day          | jump the clock, or freeze it                             |
| Quality              | low / medium / high, sets the three below                |
| Render resolution    | 50 to 100 percent. **50% draws a quarter of the pixels** |
| Sun rays and glare   | the most expensive thing on screen                       |
| Shadows              | off / low / high                                         |

Settings persist in `localStorage` and are merged onto the defaults on load, so
a save from an older build still works. Changing any graphics value by hand
drops the preset to "custom".

The store is one-way: the menu writes, the game reads, nothing writes back.

## Commands

| Command             | What it does                                 |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Dev server on http://localhost:5173          |
| `npm run build`     | Type check, then production build to `dist/` |
| `npm run typecheck` | Type check only                              |
| `npm run preview`   | Serve the production build                   |
| `npm run format`    | Prettier                                     |

## Rules that are easy to break

**Import Babylon by deep path, never from the package root.**

```ts
import { Scene } from "@babylonjs/core/scene"; // 700KB bundle
import { Scene } from "@babylonjs/core"; // 2.3MB+ bundle
```

**React and the render loop talk only through `src/ui/bridge.ts`.**
Anything else restarts the render loop on a state change.

**Game logic runs in `setSimulationStep`, at a fixed 60 steps per second.**
Never tie logic to frame rate.

## Day and night

The void colour and the key light are driven by an in-game clock. A full day
takes 300 real seconds by default.

```ts
const dayNight = new DayNightCycle(scene, {
  startHour: 10, // 0 to 24
  realSecondsPerGameDay: 300, // longer = slower cycle
});

dayNight.setTimeOfDay(22); // jump straight to night
dayNight.currentHour; // read it back
```

Colours live in `src/world/timeOfDayKeyframes.ts` as a keyframe table. Edit that
table to change how day or night looks; nothing else needs to change.

## Sun and moon

Both are real astronomy: a latitude and a declination fed through the standard
horizontal-coordinate conversion. The arc is tilted, so the sun sweeps from the
north-east, across the south, to the north-west.

|         |                                            |
| ------- | ------------------------------------------ |
| Sunrise | 06:00, bearing 60 deg (north-east)         |
| Highest | 13:30, 66 deg above the horizon, due south |
| Sunset  | 21:00, bearing 300 deg (north-west)        |

Latitude 45 deg and declination 20.95 deg were solved from the 15 hour day you
asked for. They are a real place on a real date: mid-northern latitude in high
summer.

**The moon runs on its own clock.** A lunar day is 24 h 50.5 min, not 24 h, so
the moon falls about 50 minutes behind the sun every day and works all the way
around in 29.5 days. It is high at midnight on night one, still up at 21:00 for
the first three evenings, then late enough to miss the evening entirely. Its
declination also swings over a 27.32 day month, so its arc rides higher some
nights than others.

Neither body is ever hidden. Below the horizon they keep orbiting under the
platform, so the cycle is one unbroken circle.

```ts
dayNight.sunHeight; // -1 under the platform, 1 overhead
dayNight.moonHeight;
dayNight.dayNumber;
dayNight.skipDays(3); // jump forward to watch the moon drift
```

The maths lives in `src/world/celestialPath.ts`. Brightness and disc colours
live in `src/world/SunAndMoon.ts`.

The moon has a real surface: dark maria and craters, painted procedurally in
`src/world/createMoonTexture.ts`. It is an **emissive texture**, and Babylon
_adds_ an emissive texture to the emissive colour rather than multiplying. So
the moon's `emissiveColor` must stay black or the dark patches wash out.

The sun disc is deliberately yellow, not white. Its halo is added on top of a
blue sky, so a white sun bleeds blue.

## Sun glare and god rays

The sun disc is **0.53 degrees across, the real angular size of the sun from
Earth**. It is a pinpoint on purpose. Two effects carry the drama instead:

- **Starburst glare.** A screen-facing plane with four long spikes and four
  short ones, painted procedurally and blended additively, so it behaves like
  light hitting a lens rather than a decal in the sky. Because it billboards,
  the spikes stay slim and screen-aligned however you turn. One draw call.
- **God rays.** `VolumetricLightScatteringPostProcess` with the sun disc as its
  emitter. Everything else renders black into that pass, so the platform edge
  and the player genuinely cut the shafts. That occlusion is what separates it
  from a painted effect.

The god rays are **detached from the camera whenever the sun is below the
horizon**, removing the pass rather than running it for nothing. They are
attached to the player camera only, so the orbit view and the mini-map never
pay for them.

Tuning lives in `createSunGlare.ts` (spike count, reach, width) and
`SunGodRays.ts` (exposure, decay, weight, density, samples).

## Night lighting

Three numbers decide how dark night is. All are named constants:

| Constant         | File              | Meaning                          |
| ---------------- | ----------------- | -------------------------------- |
| `STARLIGHT`      | `ambientLight.ts` | Floor on a moonless night        |
| `MOONLIT_SKY`    | `ambientLight.ts` | Extra sky glow from a high moon  |
| `MOON_LIGHT_MAX` | `SunAndMoon.ts`   | The moon's own directional light |

The ground's `diffuseColor` matters as much as any of them. A near-black ground
reads as unlit no matter how strong the light is.

## Compass

A compass is painted flat on the ground: **north is +z, east is +x**. It is lit
like the ground, so it dims at night and takes shadows.

**Do not freeze a material while the light count can still change.** A frozen
material skips the check that rebuilds its shader, and silently stops receiving
light.

## Grass

A 32 m patch of 123,904 blades, about 123 per square metre and 9 cm apart, on a
200 x 200 m platform. Blades are 5.5 cm wide, so at that spacing they overlap
into a mat. Beyond the patch the ground colour carries it.

Every blade is a **thin instance** of one 3-triangle mesh, so the whole field is
**one draw call**. Their transforms live in a single `Float32Array`; only the
blades that actually moved are re-uploaded, with
`thinInstancePartialBufferUpdate`.

Blades lean away from anything registered with `grass.addPusher(node)`, and
stand back up over 0.5 s. **Pushers are opt-in.** The ground, the compass and
the walls are never added, so the platform itself never flattens the grass.

A blade's offset, yaw and height come from a hash of the **world cell** it
stands in, not from its slot in the buffer. Walk away and back and every blade
is exactly where it was.

**The patch is a torus.** A blade's slot is its world cell modulo the patch
width, so sliding the patch rewrites only the rows and columns that genuinely
entered it: 8,448 blades instead of 123,904. Rebuilding all of them cost 6.7 ms,
which is a dropped frame every metre you walk.

Cost measured while running: **0.16 ms per step on average, 0.59 ms at worst**,
against a 16.7 ms step.

Pushers carry a `bottomOffset` so the grass knows when one has been lifted clear
of it. Without that, jumping drags a flattened circle around underneath you.

Two traps here:

- **`thinInstance*` needs `import "@babylonjs/core/Meshes/thinInstanceMesh"`.**
  Nothing else pulls it in, and without it the entire API is absent from `Mesh`.
- **`a.multiplyToRef(b)` is the Hamilton product `a * b`, which applies `b`
  first.** Composing a world-space lean with each blade's own yaw the other way
  round rotates the lean by that yaw, and every blade falls a different way.

Blades receive shadows but never cast them: the shadow frustum auto-fits around
its casters, and 9,000 blades over 40 m would blow it up and blur the player's
own shadow.

## Player

A 1.8 m capsule with the camera in its head at 1.62 m. Yaw turns the whole
body, pitch only tilts the view.

Movement runs on the fixed 60 Hz step, so walking speed does not change with
frame rate. Walking two directions at once is not faster than one.

Walk 4.5 m/s, run 8 m/s on Shift.

Jumping peaks at 1.11 m and lands after about 0.64 s. Two forgiveness windows
make it feel right: 0.12 s of coyote time after leaving the ground, and 0.12 s
of input buffering so a press just before landing still jumps.

## Head bob

Three motions layered, in `src/player/HeadBob.ts`:

|                                  | Walk     | Run      |
| -------------------------------- | -------- | -------- |
| Rise and fall, once per footstep | 8.5 cm   | 15.1 cm  |
| Sway, once per stride            | 5.4 cm   | 9.6 cm   |
| Roll, with the sway              | 0.57 deg | 1.01 deg |
| Footsteps per second             | 2.0      | 2.8      |

Amplitudes are tied to **speed**, not to a walk/run switch, so the change
between the two is a slide rather than a jump.

The phase advances with **distance actually covered**, not with time. Walk into
a wall and the bob stops instead of cycling on the spot. It also fades out in
the air and back in on landing, over 0.15 s.

Only the camera bobs. The bean itself is the collider and stays steady, so
nothing about collisions changes.

Collisions use Babylon's built-in solver, not a physics engine. The ground and
four invisible walls at the platform edge are solid; the compass is not. Without
those walls you would walk off and fall forever.

**`moveWithCollisions` reads the mesh's world matrix, not `mesh.position`.**
The simulation step runs before the render, so the matrix is a frame stale
unless you call `computeWorldMatrix(true)` first. Skip it and gravity pushes the
player upward and walls stop working.

Speeds and sizes live in `src/player/PlayerController.ts` and
`src/player/createPlayerBean.ts`.

## Shadows

Cast by the sun only, onto the ground and the compass. The player bean is the
caster; add more with `dayNight.addShadowCaster(mesh)`.

The shadow map is switched **off while the sun is below the horizon**. It is a
whole extra render of every caster, and nothing is lit by the sun then anyway.

Four traps, all of which fail silently:

- **`shadowGenerator` does not import its own scene component.** Without
  `import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent"` the
  shadow maps are never rendered. No error, no warning, no shadow.
- **An unlit material cannot receive a shadow.** The compass was
  `disableLighting = true` and had to become lit, or the shadow would vanish
  exactly where the player stands.
- **A caster must be registered.** `receiveShadows` on the ground does nothing
  on its own.
- **`bias` is a fraction of the shadow map's depth range, not a distance.**
  Leave `shadowMinZ` and `shadowMaxZ` undefined and Babylon falls back to the
  active camera's, here 0.1 to 2000 — which turned a bias of 0.0008 into **1.6
  metres** of offset. A directional light also starts at the world origin, which
  is underground, so its shadow camera has to be parked up-sun of whatever it is
  meant to be shadowing.

Quality lives in `src/world/SunShadows.ts`: map size, the two biases, and how
dark the shadow gets. The sun light refits its shadow frustum around the casters
every frame, which is what keeps a 1024 map sharp.

## Mini-map

Bottom-left, 180 px square, **first person only**. Pressing `C` for the orbit
camera removes it entirely.

It is a real second camera, not a drawing, so it shows real geometry and real
lighting. It has **two poses**:

| Pose     | Where                                   | Shows                          |
| -------- | --------------------------------------- | ------------------------------ |
| Default  | 14 m behind you, 9 m up, pitched 33 deg | Your back and the ground ahead |
| Hold `T` | 90 m straight overhead                  | 90 m of ground, flat           |

Releasing `T` slides it back. The slide takes 0.35 s, eased at both ends, and
runs on the fixed step so it takes the same time at any frame rate.

Pitch is **derived**, not configured: it is whatever angle points the camera at
you from wherever the pose puts it. Move the pose and the aim follows.

Orthographic in both poses. A map wants a constant scale, and it means the two
poses blend by sliding numbers with no change of projection part way through.
Zooming out overhead is done by widening the orthographic box, not by climbing.

The map is **player-up** — it rotates so the way you face is always screen up.
That is one line: the camera's yaw is your yaw, which both keeps it behind you
in the chase pose and, overhead, points your heading up the screen.

On top sits a small 2D canvas carrying the frame, the compass letters and the
sun and moon markers. React owns that element and nothing else; the render loop
paints it directly. Putting it in React state would re-render the overlay at
frame rate.

**Any camera that writes `rotation.z` needs `updateUpVectorFromRotation = true`,
and so does any camera looking straight down.** Babylon refreshes a camera's up
vector only when `rotation.z` _changes_, baking in the yaw and pitch of that
moment. The head bob's roll settles to exactly zero in mid-air, which froze the
player camera's up vector and rolled the horizon 25 degrees as soon as you
turned. Both the player camera and the mini-map camera set this flag.

**A camera looking straight down needs it too.**
Babylon defaults it to `false`, which builds the view matrix against the fixed
world up of `(0, 1, 0)`. Straight down makes that parallel to the view
direction, so which way is up on the map falls out of floating point noise: the
map drifts by tens of degrees and flips as you turn.

The compass ring squashes by `sin(pitch)`. A tilted camera foreshortens the
ground into an ellipse, and a flat circle of letters would not line up with it.
Overhead the squash is 1 and the ring is round.

**Cost: one extra scene render per frame.** Fine now, worth revisiting once the
world is full. The map's pixel size lives in `MINI_MAP_SIZE_CSS` and must match
`.overlay__minimap` in `overlay.css`.

## Layout

```
src/core/      engine, fixed-step loop, stats, inspector
src/scenes/    scene factories
src/world/     ground, compass, clock, day/night cycle, sun and moon
src/player/    the bean, its camera, controls and collisions
src/minimap/   the top-down camera and its overlay decorations
src/systems/   gameplay systems (empty)
src/ui/        React overlay + the bridge
src/assets/    glTF / KTX2 assets (empty)
```
