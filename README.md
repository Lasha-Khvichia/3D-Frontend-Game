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

A compass is painted flat on the ground: **north is +z, east is +x**. It is
unlit on purpose, so it stays readable at midnight.

**Do not freeze a material while the light count can still change.** A frozen
material skips the check that rebuilds its shader, and silently stops receiving
light.

## Player

A 1.8 m capsule with the camera in its head at 1.62 m. Yaw turns the whole
body, pitch only tilts the view.

Movement runs on the fixed 60 Hz step, so walking speed does not change with
frame rate. Walking two directions at once is not faster than one.

Jumping peaks at 1.11 m and lands after about 0.64 s. Two forgiveness windows
make it feel right: 0.12 s of coyote time after leaving the ground, and 0.12 s
of input buffering so a press just before landing still jumps.

Collisions use Babylon's built-in solver, not a physics engine. The ground and
four invisible walls at the platform edge are solid; the compass is not. Without
those walls you would walk off and fall forever.

**`moveWithCollisions` reads the mesh's world matrix, not `mesh.position`.**
The simulation step runs before the render, so the matrix is a frame stale
unless you call `computeWorldMatrix(true)` first. Skip it and gravity pushes the
player upward and walls stop working.

Speeds and sizes live in `src/player/PlayerController.ts` and
`src/player/createPlayerBean.ts`.

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

**A camera looking straight down needs `updateUpVectorFromRotation = true`.**
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
