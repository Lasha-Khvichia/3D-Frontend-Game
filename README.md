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

## Village

Ten houses along one street, five a side, facing each other. Every one is built
from code at startup. Nothing is downloaded, and there is no `.glb` anywhere.

Phase 0 built the shells, **Phase 1 dressed them** in stone and timber, **Phase
2 hung the doors and shutters**, and **Phase 3 lit the fires**.

### You can walk inside

That is the whole reason these are built rather than loaded. A house is four
walls with holes cut in them, so a doorway is a real gap you walk through.

A wall is not one mesh with holes punched through it. It is a row of solid
boxes, one for each stretch of wall the openings leave behind, plus an apron
under each window sill and a lintel over each opening. Boxes are what the
collision solver handles well, and what the industry settled on after
brush-based CSG fell out of use in the early 2000s.

Two failures come free with that choice:

- **Walls are 0.35 m thick.** Sprinting covers 0.133 m in one simulation step,
  so there is a factor of 2.6 between the two. Thinner than a step and the
  player crosses the wall entirely between two checks, touching nothing in
  either — which is exactly how the old downloaded houses let you inside.
- **The roof carries no collision at all.** A sloped face is the one shape the
  solver handles badly: it slides you along whatever you hit, so a roof lifts
  you up it. Nothing can reach the roof anyway. The lowest eaves are at 2.4 m
  and a jump peaks at 1.11 m.

### Sizes

|                |                             |
| -------------- | --------------------------- |
| Doorway        | 1.4 m wide, 2.05 m tall     |
| Window         | 0.95 m wide, sill at 1.05 m |
| Wall thickness | 0.35 m                      |
| Wall height    | 2.4 m to 3.4 m, by house    |

The doorway is wider than a real medieval door, which was about 1.0 m. The
player's collision ellipsoid is 0.8 m across, and level design guidance is that
a gap needs to be roughly twice the player's width before it stops feeling like
a snag. Phase 2 hangs a narrower door leaf inside the opening.

### Stone and timber

Four kinds of detail, all of it boxes, all of it decoration:

|                 |                                                                                    |
| --------------- | ---------------------------------------------------------------------------------- |
| Plinth          | A rough course of stone along the foot of every wall, 36 cm high                   |
| Scattered stone | Single stones showing through the plaster, thinning out with height                |
| Quoins          | Dressed blocks stacked up each corner, turned alternately                          |
| Timber          | A plate under the eaves, a lintel over every opening, posts on the solid stretches |

**Decoration is placed on the wall segments, not on the wall.** The segments are
what is left after the openings are cut, so a stone can never land across a
doorway or a window. That is checked: 67 openings, nothing covering any of them.

Two details earn their place more than the rest. **Quoins** are where real
builders spent their good stone, so they are the one thing that most says
masonry rather than painted box, and they hide the seam where two walls meet.
**Lintels** are what a hole in a wall needs above it; without one an opening
reads as a hole cut in cardboard.

Stone gathers low on the wall and thins towards the eaves, because the vertical
position is squared before use. That is roughly where weather and repair leave
it in real life.

**Nothing here collides or casts a shadow.** Every piece is a few centimetres
proud of a wall that already does both, so paying twice would buy nothing you
could see. It also means a stone can never snag you.

Placement is random but **seeded from the house's name**, so the village is
identical on every load. Stone and timber run on separate streams, so changing
how stone scatters does not reshuffle every beam in the village.

1,488 stone blocks and 223 beams across the village, merged down to two meshes
per house.

### Fine detail is skipped where it cannot be seen

Decoration sits on its own render layer (`src/world/fineDetailLayer.ts`) and is
left out of two passes:

- **The mini-map**, which shows 90 m of ground in 220 pixels. A 4 cm stone is
  far smaller than one pixel there.
- **The god-ray occlusion pass**, which re-renders the world in black to work
  out what blocks the shafts. Something flat against a wall already in that
  pass cannot change the silhouette.

Together those took the frame from 249 draw calls back to 189.

## Doors and shutters

| Input                           | What it does                |
| ------------------------------- | --------------------------- |
| Walk into a door                | Opens it                    |
| Lean on an open door's far edge | Shuts it                    |
| `F` at a door, from inside      | Drops or lifts the bar      |
| `E` at a window                 | Opens or shuts the shutters |
| `F` at a window                 | Bolts or unbolts them       |

Ten doors and 57 windows, 124 leaves in all. A prompt appears when you are
close enough for a key to do something. Doors get no prompt for opening,
because walking into one is the whole control.

### A push always swings the leaf away from whoever pushed it

From the street a door opens inwards; from inside it opens outwards; leaning on
an open leaf swings it shut. That single rule is what makes it impossible for a
door to sweep through the player, which is the usual way a push-to-open door
goes wrong. Games solve it the same way, with a door that is hinged both ways
and picks its direction from where you are standing.

Three things stop a door fluttering, and all three were needed:

- **A push is ignored while the leaf is still moving.** Without this the door
  reverses part way through its own swing and never arrives.
- **Shutting is judged at the leaf's far edge**, where a hand would go, not at
  its middle. The far edge of an open door is the part furthest from the
  doorway.
- **Shutting also requires you to be clear of the doorway.** Otherwise walking
  in through a door you just opened slams it behind you.

### The collider is not the door

A real plank door is about 3 cm thick. Sprinting covers 13 cm in one simulation
step, so a collider that thin could be crossed between two steps without ever
being touched. The boards you see are 6 cm; the invisible collider on the same
hinge is **22 cm**. Shutters get the same treatment at 12 cm.

### Barring and bolting

The bar is a **drawbar that slides**, not something on a hinge: that is how it
was actually done, and sliding is one number to animate with no rotation to get
the wrong way round. It waits for the door to shut before sliding across, so it
is never seen lying over an open doorway.

**The bar can only be reached from inside.** Pressing `F` from the street does
nothing at all. While it is down the door will not open for anyone, from either
side. Pressing `F` again inside lifts it.

Windows get a **small bolt that drops** from above instead. A beam the size of a
door bar across a window would cover the whole opening and look absurd.

Shutters open until they lie back flat against the wall, which is what real
shutters do and the reason they can carry collision without becoming something
you snag on.

Cost measured while running: **0.055 ms per step** for all 67 openings, against
a 16.7 ms budget. Nothing needed optimising.

## Fireplaces, chimneys, fire and smoke

Every house has a hearth burning and a chimney smoking.

### Where the chimney goes, and what it costs the wall

The stack climbs the outside of a **gable end**, the way these were really
built, rather than passing through the roof. That means the roof needs no hole
cut in it.

**The chimney wall carries no windows at all.** A window there would end up
behind the stack or behind the chimney breast. That is why the village has 43
windows rather than 57. Which gable end takes the stack is fixed per house and
varies between them, so the street does not read as one house repeated.

Everything about a fireplace is placed in a frame of reference stuck to that
wall — across it, out through it, and up. The same numbers then build the
fireplace whichever of the four walls it lands on, with no axis swapping.

### The fire and the smoke are not the same effect

They are in different places and behave in opposite ways, so they are separate
systems on separate leashes.

|             | Fire                                 | Smoke                             |
| ----------- | ------------------------------------ | --------------------------------- |
| Blending    | Additive, so overlaps brighten       | Alpha, so it darkens the sky      |
| Gravity     | **Upward.** Hot gas accelerates away | Slight rise plus a sideways drift |
| Life        | 0.45 to 1.05 s                       | 2.3 to 4.2 s                      |
| Size        | Small, tapering as it climbs         | Grows from 0.32 to 2.3            |
| Runs within | 20 m                                 | 150 m                             |

**Both were tuned by looking, not by guessing.** Three things had to be fixed
that no amount of reading would have caught:

- **Large particles read as floating balls** however they are coloured. It is
  the overlap of dozens of small additive ones that looks like flame.
- **Particles are densest where they are born**, so starting them at full
  strength piles opaque white into the bottom of the hearth however low the
  alpha goes. They now fade in over the first quarter of their life.
- **Smoke stacks its own alpha.** A value that looks right on one particle turns
  into solid black on twenty. It came out looking like a foundry before it came
  out looking like a cottage.

Every chimney drifts the same way, which is what makes it read as wind rather
than as ten unrelated effects.

### One firelight for the whole village

There is exactly **one** point light, moved to whichever fire the player is
nearest and given a flicker from two waves at unrelated speeds. Ten point lights
would blow past the four a standard material will consider at once, and the
player can only ever be in one room, so nine of them would light nothing anybody
could see.

That takes the scene to **4 lights: ambient, sun, moon, firelight.** Exactly the
limit. A fifth would silently stop one of them being used.

### Standing in the fire

You cannot. The visible surround has to leave the opening clear so the fire can
be seen through it, so a separate invisible block fills the opening. You can
step onto the hearthstone — it lifts you 9 cm, which is what a hearthstone does.

Cost of the whole system: **0.001 ms per step**, plus whatever the particles
themselves cost on the GPU. Five fires and ten smoke plumes run from the middle
of the street; none of the fires run from the far corner of the platform.

### Ten different houses, not one repeated

`houseShapes.ts` holds ten sets of dimensions: width, depth, wall height, roof
rise, and which way the ridge runs. No two match. Window counts are not in that
table because they follow from wall length, so the bigger houses pick up more
windows on their own.

`villageHouses.ts` puts them on the street. A house sits back from the middle of
the street by half its own depth, and its door always faces the street.

Each house is **two meshes**: the four walls merged into one, and the roof.
Twenty-odd boxes per house would otherwise be twenty-odd draw calls each. The
merged wall mesh does the colliding itself — there is no hidden collider,
because the visible geometry is already nothing but thick axis-aligned boxes.

Ten houses cost 40 meshes and 47,143 vertices for the whole scene.

## Grass

**Two patches, both following the player.** One patch cannot do both jobs: dense
grass has to stay small or it costs everything, and a small patch ends in a hard
edge with bare ground beyond it, which is the first thing the eye finds when you
look up.

|         | Near        | Far                |
| ------- | ----------- | ------------------ |
| Blades  | 200,704     | 147,456            |
| Across  | 40 m        | 108 m              |
| Density | 123 per m²  | 13 per m²          |
| Drawn   | as modelled | half as tall again |

The far patch is sparse standing in it and solid from any distance, because
looking at the horizon you see grass at a grazing angle and blades that stand
well apart on the ground still overlap completely from there. Being taller helps
that, and also softens the join with the dense patch.

Literal half density over that area would be 813,000 blades, four times the near
patch. Thirteen per square metre is what actually looks right.

Both patches run the same code with different numbers, from `grassLayout.ts`.
Cost together: **0.07 ms per step sprinting**, two draw calls.

**The grass is drawn once per frame, not three times.** First person renders the
world through three passes — the view, the mini-map, and the god-ray occlusion
pass — and the grass was in all of them. It is now kept out of the last two: it
is invisible at map scale over a ground plane that is already green, and it
blocks nothing a shaft of sunlight would miss. That took first person from
4.08 million triangles a frame to 1.97 million.

**The breeze is animated on the shared blade mesh, not per blade.** Every blade
is a thin instance of one 5-vertex mesh, so moving those five vertices moves all
200,704 of them, on the GPU, every frame, for nothing. The tip traces a slow
figure over about 3.4 seconds: 9 cm forward, 5 cm sideways, on a 46 cm blade.
The base stays planted.

An earlier version leaned each blade individually and swept the field in slices,
because rewriting 200,000 transforms per frame is far beyond the budget. Each
blade only refreshed 1.7 times a second, and it read as lag. Per-blade wind
needs a vertex shader, not a CPU sweep.

Because every blade carries its own yaw, they do not all lean the same way: the
field rustles rather than tilting as one slab.

Every blade is a **thin instance** of one 3-triangle mesh, so the whole field is
**one draw call**. Their transforms live in a single `Float32Array`; only the
blades that actually moved are re-uploaded, with
`thinInstancePartialBufferUpdate`.

Blades lean away from anything registered with `grass.addPusher(node)`, and
stand back up over 0.5 s. **Pushers are opt-in.** The ground and the walls are
never added, so the platform itself never flattens the grass.

A blade's offset, yaw and height come from a hash of the **world cell** it
stands in, not from its slot in the buffer. Walk away and back and every blade
is exactly where it was.

**The patch is a torus.** A blade's slot is its world cell modulo the patch
width, so sliding the patch rewrites only the rows and columns that genuinely
entered it: 8,448 blades instead of 123,904. Rebuilding all of them cost 6.7 ms,
which is a dropped frame every metre you walk.

Cost measured while running, breeze included: **0.17 ms per step on average,
1.06 ms at worst**, against a 16.7 ms step. Standing still it is 0.07 ms.

Pushers carry a `bottomOffset` so the grass knows when one has been lifted clear
of it. Without that, jumping drags a flattened circle around underneath you.

Two traps here:

- **`thinInstance*` needs `import "@babylonjs/core/Meshes/thinInstanceMesh"`.**
  Nothing else pulls it in, and without it the entire API is absent from `Mesh`.
- **`a.multiplyToRef(b)` is the Hamilton product `a * b`, which applies `b`
  first.** Composing a world-space lean with each blade's own yaw the other way
  round rotates the lean by that yaw, and every blade falls a different way.

Blades receive shadows but never cast them. 9,000 blades in the shadow map
would cost a second render of the whole field and blur the player's own shadow.

## Trees

Twelve trees, four species, grown from code. Each is a list of straight segments
produced by recursive branching, seeded from its own name so the wood is
identical on every load and no two trees are alike. About 275 segments and 4,500
leaves per tree.

### Every leaf is an entity, and none of them is a mesh

A `Leaf` is a handle onto one slot in its tree's canopy buffer. So a canopy is
**one draw call** while every leaf stays separately addressable — movable,
resizable, removable, and later pickable. Taking one off re-uploads its own
sixteen floats and disturbs nothing else. `Branch` works the same way.

Two fields per leaf and an id worked out on demand rather than stored. There are
53,600 of them; a string kept on each would cost more than the leaf.

The blade is modelled, not a card with a leaf painted on in transparency. Cards
need a texture and need sorting where they overlap, and a canopy is nothing but
overlapping leaves. Four triangles of real geometry cost less and light
properly. The fold down the middle matters: a flat leaf has one normal, so a
whole canopy flashes uniformly as the sun moves.

Leaves are scattered by picking a twig at random for each one rather than
filling twig by twig. That is what will make the level-of-detail lever work:
thinning a canopy draws only the first part of the buffer, which only looks
right if the early entries are spread through the whole tree.

### Every branch is solid, trunk to twig

Through one merged invisible shell per tree. Merged rather than left as separate
meshes, because the collision system walks every mesh in the scene that has
collision turned on, and twelve trees would otherwise add ten thousand to that
walk. It cannot reuse the visible branch mesh: that is drawn as thin instances,
and collision only ever sees the one shape they are made from.

The shell uses two box shapes, chosen by height, and the reason is the design:

- **Within reach every box is upright**, and a leaning segment is cut into
  several of them. A tilted collider is the one shape the solver handles badly —
  it slides the player along whatever is hit, so a tilted box lifts them a few
  centimetres at a time and a tree becomes a staircase.
- **Out of reach, one box lies along the wood.** Tighter, far cheaper, and
  nothing up there can be walked into anyway.

You can step onto a low branch, 11 cm up. That is a step, not a climb.

Verified: 2,478 pushes at branches from three sides each, at every height —
never once inside the wood. Collision costs 0.004 ms per step while touching a
tree.

### Wind

Three motions added together in the vertex shader, which is how vegetation wind
is done everywhere:

|              | Rises with                                          | Speed  |
| ------------ | --------------------------------------------------- | ------ |
| Trunk bend   | the **square** of height, so the base stays planted | slow   |
| Branch sway  | distance out from the trunk                         | medium |
| Leaf flutter | nothing; it is a flat couple of centimetres         | fast   |

A gust envelope scales the first two up and down over about thirty seconds, so
the wood breathes rather than oscillating.

It is a **material plugin on the standard material**, not a material of our own.
A material of our own would have to re-implement lighting, shadows and fog to
keep the trees looking like everything else; this injects a few lines into the
shader Babylon already builds and leaves the rest alone.

**No per-vertex data and no extra buffers.** Everything comes from the vertex's
world position and `world`, the mesh's own matrix, whose translation is the foot
of that tree. With thin instances Babylon builds `finalWorld = world * instance`,
so the difference between the two is the offset within the tree — which gives
both height and distance from the trunk for free. The phase comes from where the
tree stands, so no two trees move together.

**Leaves bend and sway by exactly as much as the wood.** They are separate
meshes and nothing but those two numbers keeps them together; make the leaf sway
larger and the leaves slide off their twigs. Only the flutter is theirs alone.

Two limits worth knowing. The shader is GLSL, so on a **WebGPU** engine the wind
switches itself off rather than breaking every tree material — WebGPU needs
WGSL. And a vertex shader that moves geometry does not move its **shadow**,
because the shadow pass runs a different shader; the trunk bend is a few
centimetres, so the drift is not visible, but it is there.

### Two things that must agree

The segment mesh's taper and the grower's are **one shared constant**. Apart,
every segment starts wider than the last one finished and the trunk grows a
visible collar at each joint. Segments are also drawn 12% long and capped at
both ends: butted exactly together they leave a wedge of daylight at every fork.

Building the wood costs 248 ms. Forty trees would be nearer a second, so they
will need building a few per frame.

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
four invisible walls at the platform edge are solid. Without those walls you
would walk off and fall forever.

**`moveWithCollisions` reads the mesh's world matrix, not `mesh.position`.**
The simulation step runs before the render, so the matrix is a frame stale
unless you call `computeWorldMatrix(true)` first. Skip it and gravity pushes the
player upward and walls stop working.

Speeds and sizes live in `src/player/PlayerController.ts` and
`src/player/createPlayerBean.ts`.

## Shadows

Cast by the sun only, onto the ground and the grass. The player bean is the
caster; add more with `dayNight.addShadowCaster(mesh)`.

The shadow map is switched **off while the sun is below the horizon**. It is a
whole extra render of every caster, and nothing is lit by the sun then anyway.

Four traps, all of which fail silently:

- **`shadowGenerator` does not import its own scene component.** Without
  `import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent"` the
  shadow maps are never rendered. No error, no warning, no shadow.
- **An unlit material cannot receive a shadow.** `disableLighting = true` skips
  lighting entirely, so shadows simply do not land on that surface. It costs
  nothing to set and gives no warning.
- **A caster must be registered.** `receiveShadows` on the ground does nothing
  on its own.
- **`bias` is a fraction of the shadow map's depth range, not a distance.**
  Leave `shadowMinZ` and `shadowMaxZ` undefined and Babylon falls back to the
  active camera's, here 0.1 to 2000 — which turned a bias of 0.0008 into **1.6
  metres** of offset. A directional light also starts at the world origin, which
  is underground, so its shadow camera has to be parked up-sun of whatever it is
  meant to be shadowing.

Quality lives in `src/world/SunShadows.ts`: map size, the two biases, and how
dark the shadow gets. The shadow box is a **fixed 48 m** centred on the player,
not auto-fitted: refitting resizes it as casters come and go, and sharpness pops
as it does.

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

## Assets and where they came from

All CC0, public domain, no attribution required. Credited anyway.

Nothing is downloaded today. Everything on screen is built in code: the ground,
the grass, the sky, the sun and the moon.

Two sources were tried and dropped, worth knowing before reaching for either
again. **Poly Haven has no buildings**, and its trees are film assets:
`island_tree_01` is 60 MB of geometry for one tree, about 1.9 million vertices.
For game-scale models, Quaternius via [poly.pizza](https://poly.pizza) is the
one that fits: five buildings and two trees came to 6.7 MB in total.

A photographed HDR sky was tried and removed. A photo has its own sun baked in,
so it cannot move with the clock, and keeping it meant switching off our own
sun, glare and god rays to avoid showing two. The procedural sky keeps all of
them and costs nothing to download.

## Layout

```
src/core/      engine, fixed-step loop, stats, inspector
src/scenes/    scene factories
src/world/     ground, grass, clock, day/night cycle, sun and moon
src/player/    the bean, its camera, controls and collisions
src/minimap/   the top-down camera and its overlay decorations
src/systems/   gameplay systems (empty)
src/ui/        React overlay + the bridge
src/assets/    glTF / KTX2 assets (empty)
```
