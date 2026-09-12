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
| `M`                       | Open or close the world map                         |
| `Esc`                     | Release the mouse, or close the world map           |

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

| Setting              | Effect                                                                      |
| -------------------- | --------------------------------------------------------------------------- |
| Field of view        | 55 to 100 degrees, vertical                                                 |
| Mouse sensitivity    | 0.25x to 3x                                                                 |
| Head bob             | 0 to 100 percent of the bounce                                              |
| Invert vertical look | flips the mouse                                                             |
| Date                 | jump to any day of the year; the hour stays                                 |
| Weather              | for testing: Auto, or hold any kind of weather                              |
| Time of day          | jump the clock, or freeze it                                                |
| Travel speed         | 1x to 8x walking and running                                                |
| Render distance      | 300 m to 1200 m: where the fog closes in, and past which nothing is built   |
| Quality              | low / medium / high, sets the four below                                    |
| Render resolution    | 50 to 100 percent. **50% draws a quarter of the pixels**                    |
| Auto resolution      | on: drops to as low as 70% of that while frames run slower than 60 a second |
| Sun rays and glare   | the most expensive thing on screen                                          |
| Shadows              | off / low / high                                                            |
| Clouds               | off / low / high: real 3D clouds, traced at a quarter or half resolution    |

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

The sky colour and the key light are driven by an in-game clock. **A full day
takes 20 real minutes**, so a season is about 30 hours of play and a year about 122. The game opens at 10:00 on 1 March, Year 1.

```ts
const dayNight = new DayNightCycle(scene, {
  startHours: 59 * 24 + 10, // hours since midnight on 1 January, Year 1
  realSecondsPerGameDay: 1200, // longer = slower cycle
});

dayNight.setTimeOfDay(22); // jump straight to night, same date
dayNight.setDayOfYear(354); // 21 December, same hour
dayNight.currentHour; // read it back
```

Colours live in `src/world/timeOfDayKeyframes.ts`, keyed by **how high the sun
stands**, not by the hour. The clock no longer says where the sun is — a winter
sunset comes at 17:17 and a summer one at 20:41 — and each must look like a
sunset. So a winter noon, with the sun 22 degrees up, gets the paler sky and
weaker light of a summer mid-morning.

There are two tables, morning and evening, because the same height reads a
little differently either side of noon: dawn cool and clear, the evening
golden. The sky slides from one to the other across the day, half and half at
noon, where the two agree. Edit the tables to change how day or night looks;
nothing else needs to change. Sampled at every game minute of a year, the sky
never changes by more than 0.006 in one minute, so there is no seam at noon,
at midnight, or between days.

**The sky dome is painted in the simulation step, which does not run while the
game is paused.** Anything that moves the clock from the menu must call
`sky.repaint()`, or the sun moves and the sky's colours stay behind until
the player resumes. `SettingsBinder` does this for the Date and Time sliders.

## Calendar and seasons

The calendar is the real one: January to December, their real lengths, 365
days, **no leap years**. The year turns over on 1 January. Seasons are whole
months, the way weather services count them:

| Season | Months                | Days |
| ------ | --------------------- | ---- |
| Spring | March to May          | 92   |
| Summer | June to August        | 92   |
| Autumn | September to November | 91   |
| Winter | December to February  | 90   |

Everything runs off one number: the hours since midnight at the start of
1 January, Year 1 (`src/world/calendar/calendar.ts`). The date, the season,
the sun's path, the moon's phase and the stars are all worked out from it, so
none of them can drift apart.

The stats panel shows the season with a coloured dot, the date, the time and
the air temperature where the player stands. The menu's **Date** slider jumps
to any day and keeps the hour.

### Climate

`src/world/calendar/climate.ts` gives the air temperature an ordinary day
brings, before any weather. It is modelled on an inland climate with four
strong seasons, like Kyiv's:

|                         |                                                   |
| ----------------------- | ------------------------------------------------- |
| Warmest month, July     | 20 °C on average, 25 °C on the hottest afternoons |
| Coldest month, January  | −4 °C on average, −6.5 °C on the coldest dawns    |
| Coldest hour of the day | sunrise                                           |
| Warmest hour of the day | 15:30, two and a half hours after the sun's peak  |
| Height                  | 6.5 °C colder for every kilometre up              |

The warmest weeks come a month after midsummer, around 23 July, and the
coldest around 22 January: land takes that long to catch up with the sun. The
dawn-to-afternoon rise is 10 °C in summer and 5 °C in winter. The weather
pushes it up and down from here (see [Weather](#weather)), and a later health
system will read it.

## Weather

The weather is **worked out afresh every step from the date and hour**, never
stored (`src/world/weather/`). The same moment always has the same weather:
that is what will let a forecast be read ahead, and a saved game come back to
the sky it left. Every random draw is a hash of one world seed and where in
time it is (`weatherNoise.ts`).

### How a day is decided

`dayPlans.ts` is a weather generator of the kind climatologists use
(Richardson's WGEN), fed Kyiv's records for 1991–2020, the climate the
temperatures already follow:

- **Wet or dry** is a Markov chain. A wet day follows a wet day 60% of the time,
  and the chance after a dry day is worked back from each month's share of wet
  days, so rain comes in spells and the year's count still comes out right.
- **Bright or grey.** Cloud is mostly one or the other. Dry days are bright
  often enough that each month's sunshine comes out as Kyiv's.
- **Rain spells**, one or two on a wet day. Summer's are afternoon showers,
  sometimes a thunderstorm; the rest of the year's are long, grey and steady.
- **Fog mornings**, lifting by mid-morning, or in winter lasting all day; and
  **mist mornings** after clear, calm nights.
- **Purple days**: 8 or 9 a year, four in five in spring or summer, never two
  running, and never the game's opening day.

Measured over ten simulated years. The thunderstorm count is a target, not a
Kyiv figure: no count for Kyiv turned up.

|                                  | Game           | Kyiv            |
| -------------------------------- | -------------- | --------------- |
| Wet days a year                  | 158            | 164             |
| Days with snow falling           | 62             | about 61        |
| Thunderstorm days                | 25             | no figure found |
| Sunny share, January and July    | 13% and 67%    | 15% and 60%     |
| Mean temperature, January / July | −3.8 / 19.5 °C | −3.5 / 20.5 °C  |

### What each kind does

| Kind         | Cover | Darkness | Visibility | Falling | Wind    |
| ------------ | ----- | -------- | ---------- | ------- | ------- |
| Clear        | 4%    | —        | —          | —       | 3 m/s   |
| Fair         | 32%   | —        | —          | —       | 4 m/s   |
| Cloudy       | 58%   | 0.05     | —          | —       | 5 m/s   |
| Overcast     | 90%   | 0.2      | 2.5 km     | —       | 4.5 m/s |
| Fog          | 85%   | 0.1      | 140 m      | —       | 1 m/s   |
| Drizzle      | 94%   | 0.3      | 1.6 km     | 0.15    | 4 m/s   |
| Rain         | 96%   | 0.45     | 900 m      | 0.5     | 6 m/s   |
| Downpour     | 98%   | 0.65     | 350 m      | 1       | 8 m/s   |
| Thunderstorm | 100%  | 0.9      | 500 m      | 0.85    | 12 m/s  |
| Purple       | 45%   | —        | —          | —       | 3 m/s   |

What falls is decided by the temperature where the player stands: snow below
0.5 °C, sleet up to 2.5 °C, rain above, and hail from one summer storm in five.
The stats panel names it — "Light snow", "Blizzard" for heavy snow in a wind of
10 m/s or more, "Thundersnow", "Hailstorm". Falling snow hides far more than
rain: 300 m in heavy snow, 120 m in a blizzard.

Wind swings slowly either side of the westerly, calmer or wilder from day to
day. The look eases across four hour marks with a cubic B-spline, so nothing
changes at once: a clear sky takes about two real minutes to cloud over.

The weather also sets the temperature: warm and cold spells lasting days,
five degrees either side in winter and three in summer — a winter spell above
freezing is a thaw — while cloud flattens the day's rise to 40% of a clear
day's and rain cools warm air by up to 2 °C.

### What it changes

- **The clouds**: their cover, and the wind that carries them.
- **The sky**: greyed by cloud; darkened in a storm — dark grey air, black
  clouds, weaker light; tinted on a purple day, keeping each colour's
  brightness so a purple night is still night; and, in thick fog or heavy
  rain, flattened to the fog's colour with the clouds faded out, because past
  a few hundred metres there is no sky to see.
- **The fog**: visibility pulls the haze in. The render distance still decides
  what is built, so a lifting fog shows a finished world.
- **Ground mist**, below.
- **Rain, sleet, hail and snow** falling round the player, below.
- **Wet ground and puddles**, which follow the rain of the last day, below.
- **The snow line** on the high ground, which follows the season, below.
- **Wind** in the trees (strength and direction; trees move on WebGL only),
  the grass and the chimney smoke — all the same way as the clouds.

The menu's **Weather** slider holds any kind, for testing; the stats panel
shows the weather and the air temperature.

### Ground mist is height fog

Babylon's fog knows only distance. Mist made of it turned the whole mountain
into a flat grey cut-out under a clear dawn sky. `HeightMistPlugin` is the
standard exponential height fog instead, on every standard material: dense at
the lowland floor, thinning to a third every 15 m up, integrated along each
line of sight (Íñigo Quílez's closed form). In a valley the fields go white at
about 250 m and the peaks stand clear; from a hill you look down on a sea of
mist. It is mixed in before Babylon's own fog, so the two work together.

**It finds Babylon's fog line by its exact text** —
`float fog=CalcFogFactor();` in GLSL, `var fog: f32=CalcFogFactor();` in WGSL —
replacing it through a plugin key starting with `!`, which Babylon applies as a
regular expression after its includes are expanded. If a Babylon update
rewrites that line, the mist silently stops: the shader still compiles and
nothing matches.

### Rain, sleet, hail and snow

Everything that falls is drawn round the player in at most three draw calls
(`src/world/weather/precipitation/`): streaks for rain, sleet and hail, flakes
for snow and sleet's icy half, and rings where rain lands. Each is one mesh of
small quads that never changes. The vertex shader places every drop from its
own random numbers and how far the fall and the wind have carried it, and wraps
it into a box round the eye, so the rain never runs out and nothing is sent to
the GPU however hard it rains. Drops move on real seconds, like the clouds.

| Falls as | Speed        | Looks like                                  | Wind carries it |
| -------- | ------------ | ------------------------------------------- | --------------- |
| Rain     | 3.5 to 9 m/s | streaks 1 to 1.5 cm wide, 1/30 s of fall    | 90%             |
| Sleet    | 4 and 2 m/s  | thin streaks and small flakes together      | 80% and all     |
| Hail     | 11 m/s       | short white streaks 2 cm wide               | 60%             |
| Snow     | 1 to 1.3 m/s | flakes 3 to 5 cm, swaying 20 cm either side | all             |

Speeds follow measured terminal velocities: drizzle about 2 m/s, a downpour's
big drops 9, snow about 1. The weather's rate, 0 to 1, sets how many of the
16,000 streaks or 24,000 flakes are shown and how heavy they are. Water takes
the sky's colour and a little of the sun's; ice is white, as bright as the
daylight. At night rain all but vanishes, as it does.

Nothing is drawn thinner than a pixel and a half. A centimetre-wide streak ten
metres off broke into dashes or vanished; it is widened instead and made
fainter by the same share, so distant rain reads as a grey veil. Drops within a
metre of the eye fade out: one passing the lens lay across half the screen as
a bright bar.

**Rain stays out of houses.** `Shelter` holds every roof as the exact gable
`createGableRoof` builds, overhangs included. The eight nearest the player go
to the shaders every step (`NearRoofs`), and a drop is hidden once its lowest
point is under one. Measured over every spot in every settlement, no more than
six roofs ever reach into the rain round the player. The ground, rivers and
sea come from a 64 m map of heights round the player (`CatchMap`): 16-bit
heights in two 8-bit channels, which every GPU can read in a vertex shader,
rebuilt on the CPU after twelve metres of walking.

Roofs were in that map first. At half a metre a texel a 37-degree roof is up to
19 cm out, and it showed: splash rings on the ceiling of the room below, and
drops falling through into it. A headless check now compares the shaders' roof
test with the exact roof at 20 million points round every house: all match.

**Splashes**: 600 rings within 9 m of the player, each lasting 0.35 s, none in
snow. A ring is laid on the slope it lands on: a level ring on a roof dipped
11 cm into it on its uphill side. Where the surface either side disagrees — a
ridge, an eave, a roof's edge — the ring is not shown, rather than hang in the
air. In grass they are mostly hidden, as real ones are.

**Anything under a roof is dry.** Wind-driven rain does not reach under an eave
or in at a door. `Shelter.covers` answers "is this point under cover", for the
wet and the cold later.

Costs: the map takes 1.1 ms to rebuild (1.8 ms at worst) once every twelve
metres walked, and picking the nearest roofs 0.6 µs a step. Rain is 64,000
vertices and snow 96,000, each testing eight roofs; nothing is drawn while
nothing falls.

### Wet ground and puddles

What the rain leaves behind (`src/world/weather/wet/`). The ground and the
grass darken and turn glossy, water stands in puddles on the flat, and the
rain still falling rings them. Under a roof the ground stays dry.

**How wet the ground is, is a function of time, like the weather itself.** It
is the last day of weather replayed — rain soaking in, sun and wind carrying
it off — and nothing is kept between steps that the date cannot rebuild. So a
moment always looks the same, and jumping the clock from the menu gives the
same wet ground as walking there. Measured: no difference at all over five
days of comparisons. Walking forward, only the newest quarter-hour is worked
out; the whole day is replayed only when the clock jumps, which costs 0.2 ms.

|               |                                                                                 |
| ------------- | ------------------------------------------------------------------------------- |
| Soaks         | 0.4 hours of the heaviest rain, from dry to soaked                              |
| Dries         | about 4 hours in sun and no wind; a still, overcast night is three times slower |
| Puddles fill  | 1.6 hours of that rain, and only once the ground can take no more               |
| Puddles drain | 7 hours, so they are the last water to go                                       |
| Frozen        | below 0.5 °C it falls as snow and does not soak in; below 0 nothing dries       |

Over a year the ground is damp a quarter of the time, with puddles worth
seeing on 15% of it.

**Where it shows.** The darkening is everywhere the grass and the ground are.
Puddles need flat, open ground you can see: beaches, riverbanks, the bare
upland, and tilled fields when farming arrives. In the meadow the grass hides
most of them, which is also what real grass does.

The shader is a material plugin (`WetGroundPlugin`), **attached by hand where
the ground and the grass materials are made**, not registered for every
standard material: only those two show it, and matching by material name would
break silently the day one is renamed. The ground alone carries the puddles,
the ripples and the roofs — the four nearest, the same shapes the rain is kept
off by, so the floor inside a house stays exactly as dry as it was before the
rain (checked pixel for pixel).

Puddles are a noise field over world coordinates, cut at a level that rises
with the standing water, and only where the surface faces up. Their rings are
one ripple at a time in each 0.6 m cell, each starting at its own moment in
its own place — a ring in every cell at once, all the same size, read as
corrugated metal. The whole effect sits behind one test on a uniform, so dry
weather costs a branch and nothing else.

### Snow on the high ground

The two biggest ranges keep their snow all year: the 270 m massif north of
the island and the 180 m range to the south. The eastern hill, 150 m, stays
bare rock — a deliberate choice, and it gives the east its own look.

**The snow line follows the climate, not a calendar of its own.** It is the
day's mean temperature at sea level, mapped from 95 m at 10 °C down to 45 m
at −4 °C, so snow creeps down the slopes through autumn and lifts again in
spring with nothing anywhere saying "winter". Measured over a year: never
above 95 m, down to 45 m on 22 January, moving at most 0.74 m a day, and not
bobbing at all between dawn and afternoon. Like the weather, it is a function
of time and nothing is stored. It stops at 45 m on purpose: lowland snow
needs a depth map that builds up and melts, which is the next phase.

Snow is laid on **in the ground shader**, not in the vertex colours it used to
be painted into, because a patch of ground is coloured once when it is built
and the line has to move under it. It thins on a steep face but never leaves
it: from the valley a mountain is almost all steep face, and snow only on its
ledges reads as no snow at all. Where snow lies it takes over from the wet
ground — rain does not pool on it.

**Footprints.** The player's trail is the one thing here that is stored: no
date can work out where somebody walked. A map 20 m round the player, at 5 cm
a texel, holds **when** each spot was trodden and **how deeply**, and the
shader ages the prints from one uniform — so nothing is ever redrawn as they
fade. They fill in over about 3 game hours, and far faster while snow is
falling or the wind is up: a blizzard wipes a trail in minutes.

A step sends up only the 2.3 KB block round the print, never the whole 576 KB
map. Walk more than 20 m away and the trail is forgotten: at this resolution
a map of the island would be gigabytes.

Two traps, both found by the pictures, both silent:

- **A one-channel raw texture (`CreateRTexture`) sampled black.** The print
  map holds one byte of use per texel and asked for a one-channel texture;
  every sample came back 0, with no error anywhere. It is RGBA now, and the
  spare room holds how deep each print is.
- **WGSL will not let `textureSample` be called inside a branch** ("must only
  be called from uniform control flow"). The snow reads its map inside its own
  `if`, so it uses `textureSampleLevel`, as the rain's shaders already did.
  WebGL never complained; WebGPU refused to compile the shader.

### Not yet

Stone, timber and thatch do not darken in the rain, and no snow settles on a
roof or a branch; only the ground, the grass and the high ground know about
the weather. Lowland snow that builds up and melts, ice on the rivers, and
prints in mud rather than snow are the next phase; lightning and thunder
after that.

## Sun and moon

Both are real astronomy: a latitude of 45 degrees and the sun's place on its
yearly path, fed through the standard horizontal-coordinate conversion. **The
sun is highest at 13:00 all year**, as across most of Europe, and the day grows
and shrinks evenly around that hour:

| Date               | Sunrise                       | Sunset | Daylight | Sun at noon |
| ------------------ | ----------------------------- | ------ | -------- | ----------- |
| 1 March, the start | 07:30, a little south of east | 18:30  | 11.0 h   | 37°         |
| 20 March           | 07:00, due east               | 19:00  | 12.0 h   | 45°         |
| 21 June            | 05:17, north-east             | 20:41  | 15.4 h   | 68°         |
| 21 December        | 08:43, south-east             | 17:17  | 8.6 h    | 22°         |

The yearly path is the standard low-precision solar formula: the world's axis
tilted 23.44 degrees, and an orbit slightly oval, closest to the sun on
3 January. The oval is why the summer half of the year is a week longer than
the winter half. Its one tuned number puts the equinoxes and solstices on 20
March, 21 June, 22 September and 21 December, within hours of where they fall
in 2026. The maths is in `src/world/calendar/solarYear.ts`.

**The moon falls about 50 minutes behind the sun every day** and works all the
way round in 29.5 days: 13 full moons in the first year. It is full on the
first night. It keeps close to the sun's yearly path, so a full moon, opposite
the sun, rides as high as the sun will six months later: 68 degrees on a
December night, 24 on a June one.

Neither body is ever hidden. Below the horizon they keep orbiting under the
platform, so the cycle is one unbroken circle.

```ts
dayNight.sunHeight; // -1 under the platform, 1 overhead
dayNight.moonHeight;
dayNight.dayNumber; // whole days since 1 January, Year 1
dayNight.setDayOfYear(354); // 21 December, to see the winter moon ride high
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

The god rays are **detached whenever the sun is below the horizon or more than
25 degrees off the screen's edge**, and so is the halo pass whenever neither
the sun nor the moon is up and near the screen (15 degrees). Each of those
passes redraws the world into its own texture — about 130 and 150 draw calls —
for an effect centred on something out of sight. The halo pass runs for the
view camera only, never the mini-map.

Two Babylon traps, both silent:

- **Detaching `VolumetricLightScatteringPostProcess` leaves its occlusion pass
  running.** Babylon puts that render target in `camera.customRenderTargets`,
  and detaching only takes the post-process off. It drew the world in black all
  night, and with sun rays switched off in the menu. `SunGodRays` takes the
  target off the camera too.
- **An effect layer's `camera` option is not enough.** It stops the layer's
  texture being drawn for other cameras, but the layer is still merged onto
  every camera's picture. The halo is switched with `isEnabled` before each
  camera draws instead (`CelestialGlow`).

Tuning lives in `createSunGlare.ts` (spike count, reach, width) and
`SunGodRays.ts` (exposure, decay, weight, density, samples).

## Sky and clouds

The sky fades from deep blue overhead to pale at the horizon, with a halo round
the sun and a warm band along the horizon under a low sun. The clouds in it are
**real 3D volumes**, built the way Guerrilla built Horizon Zero Dawn's (Nubis)
and lit the way Frostbite lights its clouds (Hillaire 2016). They drift with
the wind, change shape as they go, are lit by the time of day, come and go with
the weather, cast shadows on the island, and dim the sun when they cross it.

### Three spheres round the eye

| Sphere     | Distance | Why there                                                    |
| ---------- | -------- | ------------------------------------------------------------ |
| Sky        | 1,398 m  | behind everything; inside the 1,400 m far plane              |
| Sun, moon  | 1,390 m  | in front of the sky                                          |
| Cloud veil | 1,300 m  | in front of the sun and moon — the moon's near face included |

Clouds are drawn into the veil, which is depth-tested like anything else: land
in front of it hides the clouds behind it, and a cloud in front of the sun
hides the sun. The land between 1,300 m and 1,400 m is behind the veil too,
which is harmless — the fog has fully hidden it by 1,200 m.

### How a cloud is drawn

1. **Noise, built once.** A 64³ volume of Perlin-Worley lumps, a 32³ volume of
   finer Worley that eats the edges into wisps, and a 256² map of where clouds
   grow and how tall. 671 ms of arithmetic, done in a **Web Worker** so the game
   keeps drawing; the sky is clear for that moment.
2. **The march.** Every frame, a ray per pixel of a smaller target — half the
   screen's width and height on High, a quarter on Low — steps through the
   layer from 1,400 m to 3,600 m up: 72 steps on High, 40 on Low. The layer is
   a shell round a real-sized Earth, so clouds sink to the horizon instead of
   running flat to infinity.
3. **The light.** At each step inside cloud, a second short march toward the
   sun finds how much light gets there. Three octaves of ever-weaker absorption
   stand in for light bouncing many times inside, which is why thick cloud
   glows grey rather than going black; a forward-leaning phase function gives
   the silver lining when you look toward the sun.
4. **Blending frames.** Each frame starts every ray at a different offset and
   keeps 86% of the last frame, turned to follow the camera. Clouds are far
   enough away that turning is all that moves them on screen, so there is no
   motion to track: a few dozen steps a frame add up to a smooth picture.
5. **The veil** turns each pixel's direction back into the position the march
   drew it at, and lays it into the scene.

The numbers that decide the look are one table, `shaders/cloudLook.ts`.

### Light through the day

- **Day:** the sun's colour and strength from the time-of-day table.
- **Sunset:** clouds keep the sun after the ground has lost it — from 1.4 km
  up the horizon is several degrees lower — so they light up orange from
  below while the island is already in shadow.
- **Night:** the moon, faintly, once the clouds have lost the sun too.
- **Overcast** is bright grey, not dark blue: sunlight that has bounced many
  times comes out of every side of a cloud, thinning with the cloud above,
  which is what gives an overcast its lighter and darker patches.

### Weather

Cover and wind come from the weather (see [Weather](#weather)); the wind a
kilometre and more up blows at 5 m/s plus 1.8 times the wind at the ground.
**The drift runs on real seconds, not game hours** — a game day is twenty
minutes, and on the game clock clouds would race across the sky.

### Shadows, and the sun going in

Every standard material — ground, grass, houses, trees, stones, water — gets a
material plugin that dims **only the directional lights**, the sun and the
moon, by the cloud between them and the pixel. The sky's light and the fire
indoors are untouched. Because the light is dimmed rather than the pixel
darkened, a tree's shadow fades under a cloud the way a real one does.

The cloud is sampled once, low in the layer where cumulus are widest, with the
same weather, cover and shape noise the clouds are drawn from — so each shadow
is the shape of its cloud and moves with it. A CPU copy of that formula tells
the halo, the glare and the god rays when the sun is behind a cloud.

| Measured over 16 km, midsummer or March | Share of sunlight reaching the ground |
| --------------------------------------- | ------------------------------------- |
| No cloud                                | 100%                                  |
| Broken sky                              | 66% on average                        |
| Overcast                                | 22% on average                        |

Over a small area the share depends on which clouds happen to lie toward the
sun. A low sun looks up at cloud kilometres away: over 2 km round the village,
a broken sky let through 80% at midsummer noon and 38% at noon on 1 March,
because the March sun was looking through a cloudier patch 2.7 km south.

### Stars

At night the sky is full of stars, crowding along the Milky Way, and turning.

- **About 10,000 stars, 5,000 above the horizon at once** — worked out from the
  shader's own formula, and close to the real naked-eye sky. Brightness
  follows a steep curve, so most are faint and a handful are bright, and each
  has a colour from blue-white to orange-red.
- **Nothing is stored.** The sky is cut into the six faces of a cube, 150
  cells a side; each cell holds a star or not by a hash of where it is. Cells
  near a cube corner cover less sky, so fewer of them hold one, or the corners
  would be crowded.
- **The Milky Way** lies along the real galactic plane, brightest toward the
  galactic centre and split by dark dust lanes, with extra faint stars crowded
  into it.
- **The sky turns** about the celestial pole, 45 degrees up in the north, once
  every 23 hours 56 minutes — four minutes faster than the sun, as in reality.
  That is one extra turn a year, so each date has its own night sky, the same
  every year: the Milky Way's bright core stands due south at midnight in late
  June, and in December it is below the horizon all night.
- **Twilight and moonlight brighten the sky itself.** The faint stars stay
  under it and come out as it darkens; under a full moon only the brightest
  are left, and the Milky Way is gone.
- **They twinkle**, more near the horizon, where their light crosses more air
  and fades to nothing at the horizon itself.
- **A shooting star** crosses every 25 to 90 seconds on a clear night.

Two traps. **A star's distance from the pixel is taken from the difference of
two directions, never from 1 − dot**: near 1 a float has too few steps left, and
every star came out square. And **no star sits in the row of cells along a cube
edge**: the next face never looks at them, and one there was drawn cut in half.

### Written twice

The game runs on WebGPU where the browser has it. Babylon can translate WebGL
shaders for WebGPU, but only by downloading two compilers from its own servers
the first time, which would make the sky depend on someone else's network. So
every new shader exists in **GLSL and WGSL, line for line alike**: the march,
the sky, the veil and the shadow plugin. Both were checked rendering the same
picture.

### Cost

Three draw calls: the sky, the veil and the march. The march is the expensive
part and scales with pixels × steps: at 1080p, High traces 518,400 rays of 72
steps and Low 129,600 of 40, about a seventh of the work. **Its real cost on a
GPU has not been measured** — the test machine renders in software. The frame
time in the stats panel is the number to watch.

## Night lighting

Three numbers decide how dark night is. All are named constants:

| Constant         | File              | Meaning                          |
| ---------------- | ----------------- | -------------------------------- |
| `STARLIGHT`      | `ambientLight.ts` | Floor on a moonless night        |
| `MOONLIT_SKY`    | `ambientLight.ts` | Extra sky glow from a high moon  |
| `MOON_LIGHT_MAX` | `SunAndMoon.ts`   | The moon's own directional light |

The ground's `diffuseColor` matters as much as any of them. A near-black ground
reads as unlit no matter how strong the light is.

## The island

One island about two kilometres across, with sea to the horizon on every side.
The coast is not a square and not a circle: five sine waves round the compass
give it its large shape, and a domain warp — moving each point before asking
the island about it — bends that into bays and headlands.

|               |                                                           |
| ------------- | --------------------------------------------------------- |
| Coast         | 840 m to 1248 m from the middle                           |
| Tallest peak  | about 214 m, snow above 95 m                              |
| Settlements   | all on level ground at exactly y = 0                      |
| Sea level     | 2.5 m below the settlements                               |
| Height grid   | 769 x 769 samples, 4 m apart, built in 175 ms             |
| View distance | the render distance, 300 m to 1200 m; haze from 35% of it |
| Far plane     | 1400 m, whatever the render distance                      |

**Every settlement sits at exactly zero**, and that is why the sea is below it
rather than at it. Every house, door and hearth was built assuming a floor at
zero; the terrain flattens each settlement's ground to zero and eases the
relief away around it, so none of that code had to change. People settle in
the flat bits — scattering villages over finished terrain would put a door
three metres up a hillside.

Every settlement is also unioned into the coastline as a disc of land of its
own. The coast is noise, and noise does not know where people live.

### Fog is what makes a horizon

Without it the sea is a sheet of one colour meeting the sky along a hard
line, and a house 900 m away is a sharp little model sitting on the land.

It is **linear** rather than exponential. Exponential fog thins out but never
finishes, so geometry would still be faintly visible at the moment the far
plane cut it in half. Linear fog reaches full sky colour at the render
distance — 1200 m at most, safely inside the 1400 m clip — so nothing is ever
seen to pop.

Babylon measures it along the **straight line from the eye**, not the depth
into the screen (`length(vFogDistance)` in its shader). So past the render
distance everything is fully hidden in every direction, the corners of the
screen included — which is what lets the world skip building anything there.
See [Render distance and streaming](#render-distance-and-streaming).

The colour is not a constant. `DayNightCycle` pushes the sky colour into it on
every step, or the world would sit in grey smoke at midnight.

The weather can bring it closer: fog, a downpour or a blizzard shortens the
visibility, and the haze then thickens from close by rather than from a third
of the way out. It never pushes the fog further than the render distance.

### The sky moves with you

The sun and moon used to hang 800 m from the **world origin**. On a 200 m map
that reads correctly, because the player is never far from the middle of it.
On a 2 km map it is badly wrong: walk a kilometre and the sun swings across the
sky, because you closed a real fraction of the distance to it.

They are now placed relative to the player, which is what "far away" means,
and 1,390 m out rather than 800 m, so that clouds can pass in front of them —
see [Sky and clouds](#sky-and-clouds). Their materials also set
`fogEnabled = false`: they sit deep in the haze, and would otherwise fade into
the sky they are supposed to light.

## Terrain

**One height function makes the whole island** — sea floor, beach, shallow
shelf, rolling hills, three mountain ranges, and level ground under every
settlement — in `src/world/terrain/terrainHeight.ts`. It is sampled once into
a grid, and nothing reads the function after that.

**Everything reads the grid**: the mesh, the player's feet, the grass, the
trees, the stones. Reading the function directly would give the player a
different surface from the one drawn — the mesh is flat between its corners
and the function is not — and the difference shows up as feet sinking into
hillsides or hovering over them. `HeightGrid.heightAt` splits each cell along
the same diagonal the mesh does, so they match exactly.

### The ground is not a collision mesh

The player stands on the grid, read directly, and is lifted onto it after
every move. Babylon's collision solver never sees the ground at all.

That is the fix for getting stuck and for invisible walls. Both came from the
solver resolving the player against two surfaces at once — the ground and a
rock sitting on it — and finding no way out of the crease between them. With
the ground out of the solver there is no crease to be caught in. Collision
meshes are now only houses, trees, stones and bridges.

|                     |                                                                    |
| ------------------- | ------------------------------------------------------------------ |
| Ground              | patches of 32 x 32 cells: 128 m at 4 m up to 1024 m at 32 m        |
| Built at spawn      | 172 patches in 76 ms; all 274 full-detail squares were before      |
| Never built         | patches wholly on the deep sea floor, and past the render distance |
| Draw calls at spawn | 1,259 in the browser, every pass counted; 1,552 before             |
| Ground contact      | 0.03 ms per step, slopes and water included                        |

### Detail falls away with distance

The ground is a tree of **patches** (`src/world/terrain/patches/`). Every patch
is a mesh 32 cells square, whatever its size: at level 0 that is 128 m with the
grid's own 4 m cells, and each level up is twice as wide with cells twice as
big. Nine level-3 patches of 1024 m cover the whole grid. Every patch costs the
same to build (0.44 ms) and to draw (2,048 triangles).

**Every patch knows how wrong it would look** before anything is built: its
error is the furthest its mesh strays from the true ground, measured at every
sample it skips. A parent's error includes its children's, so a patch never
looks good enough while a quarter of it does not.

A patch splits into its quarters when either is true:

- **It strays by more than a pixel and a half** at its distance — error above
  0.0015 of the distance, on a 1080-line screen at the default field of view.
  Small enough that a patch changing level is not seen to move.
- **It is inside the full-detail ring**: 160 m for level 1, doubling per level.
  Height error alone would let flat ground go coarse under your feet, because
  coarse is exact where the ground is flat. The colour would not be: the sand
  line and the speckle are per vertex, and 32 m apart they smear.

It merges again only when its need falls to three quarters of that, so a patch
on the line does not swap back and forth as the player sways.

| Level | Cells | Error: median | 90%    | worst  |
| ----- | ----- | ------------- | ------ | ------ |
| 1     | 8 m   | 0.58 m        | 2.78 m | 9.8 m  |
| 2     | 16 m  | 2.77 m        | 7.70 m | 12.7 m |
| 3     | 32 m  | 6.64 m        | 16.1 m | 24.4 m |

So **meadows go coarse from about 400 m, and mountains, river channels and the
coast never do** — they are exactly what you would see jump. At spawn that is
131 patches at level 0, 38 at level 1 and 3 at level 2.

**No hole, ever.** A drawn patch that wants more detail stays on screen until
all four quarters are built, then is swapped for them in one step; four
quarters that want less wait for their parent the same way. Walked across the
island and back at 56 m/s: 3,997 steps, **0 holes and never two levels drawn at
once**, 0.04 ms per step on average and 4.8 ms at worst. Building is capped at
2.5 ms a step, nearest first, and at least one patch is always built.

**Skirts close the seams.** Where a coarse patch meets a fine one, the coarse
edge is a straight line between its vertices and the fine one follows every
sample, and the slit between them would show the sky. Each edge hangs a strip
straight down to cover it, twice as deep as the worst edge error at any level,
plus half a metre — 25 m on the steepest mountain edges. The strip copies the
colour and normal of the edge above it, so what shows through a slit looks like
the ground beside it. Each edge picks its winding at run time from Babylon's
rule; all 44,032 strip faces at spawn were checked to face outward.

**Normals come from the patch's own spacing, colour from the fine grid.** A
coarse patch lit by 4 m normals shows the tilt of ground it no longer draws,
and distant hills come out blotched. Steepness decides where rock shows, and
read from the fine grid it paints every vertex the same at every level, so a
patch changing level does not change colour.

### Hills, mountains and snow

Hills are layered noise with each layer at 0.42 of the one before, not 0.5.
At 0.5 every layer adds the same amount of slope as the last, because its
height halves exactly as its wavelength does, and four layers would be too
steep to walk up. Dips are flattened to under a metre: the first version let
a third of their depth through and sank a third of the island under the sea.

Mountains are ridged noise — `1 - |n|`, squared — which turns every zero
crossing of smooth noise into a crest. **Four layers, not five**: the fifth has
a wavelength of 17 m, which the 4 m grid samples four times, and four samples
of a sharp crest is a row of spikes. One pass of smoothing over ground above
40 m takes the last teeth off the ridgelines.

Colour is per vertex on one material: seabed, sand, meadow, upland, snow by
height, and rock wherever it is steeper than about 38 degrees. Snow thins on
steep faces but does not vanish from them — seen from a valley a mountain is
almost all steep face, and snow only on its ledges read as no snow at all.
It is plain on purpose; weather will own it later.

## Render distance and streaming

**World → Render distance**, 300 m to 1200 m. The default, 1200 m, is exactly
the view the island had before it was a setting. It moves the fog, and the fog
is what hides everything past it — so past it, nothing is kept.

The camera's far plane stays at 1400 m whatever the setting. Depth precision is
decided by the ratio of far to near plane, and the sun and moon hang 1,390 m
out; a far plane pulled in to 300 m would cut them off.

`WorldStreaming` keeps it all in step, once per simulation step:

| Thing  | Near the player         | Further off                                      | Past the render distance |
| ------ | ----------------------- | ------------------------------------------------ | ------------------------ |
| Ground | full detail             | coarser patches                                  | not built                |
| Stones | built within 250 m      | thrown away past 280 m                           | —                        |
| Trees  | canopy tiers, as before | thinned canopies                                 | switched off             |
| Houses | everything              | bolts and bars hidden past 40 m, trim past 150 m | switched off             |

**What remembers something is hidden, never thrown away.** A tree will one day
lose a branch; a door can be left open or barred. Switched off, a house is not
drawn, not in the shadow map and not collided with, but walk back and the door
is still open — tested. **What remembers nothing is rebuilt**: ground and stones
come back identical from the same numbers.

| Measured, same scene and view    | Before  | After, 1200 m | After, 300 m |
| -------------------------------- | ------- | ------------- | ------------ |
| Meshes drawn, mountain facing S  | 861     | 195           | 27           |
| Triangles, mountain facing S     | 335k    | 127k          | 29k          |
| CPU per frame, mountain facing S | 11.9 ms | 2.2 ms        | 0.5 ms       |
| Meshes drawn, spawn facing S     | 260     | 113           | 61           |
| Meshes in the scene              | 2,150   | 1,298         | 1,156        |
| Colliders switched on            | 806     | 329           | 269          |
| Draw calls at spawn, in browser  | 1,552   | 1,259         | —            |

CPU per frame is Babylon's own work before the GPU sees anything, measured
headless. The stones were most of it: 247 separate draws from the mountain.

**Stones are never late.** Driven through sixty stones at 60 m/s — faster than
the top travel speed — over 54,163 steps, not once was a stone within reach of
the player still unbuilt. Eight are built a step, nearest first, 0.15 ms each.

Two traps this uncovered:

- **Babylon's picking ignores `isEnabled` when you give it a filter.** Every
  pick here has one, so a hidden house could still stop a ledge ray the player
  would walk straight through. Both ray filters now check it too.
- **The god-ray pass searches its skip list for every mesh, every frame.**
  Stones are added as they are built and taken off as they are thrown away
  (`forgetExcluded`); left on, the list would grow for as long as you played.

## Frame rate

The target is **60 frames a second: 16.7 ms a frame**. Faster screens still get
more frames, smoothed as below.

### Measured before and after

Measured in headless Chrome with Babylon's own draw-call counter, pass by
pass. The test machine draws in software, so it cannot say how fast a real GPU
is; draw calls and bytes sent are the same on any machine.

|                                              | Before  | After  |
| -------------------------------------------- | ------- | ------ |
| Draw calls, walking the same route, 10:00    | 1,008   | 461    |
| Draw calls, the opening view behind the menu | 1,229   | 798    |
| Grass sent to the GPU, 400 m at a sprint     | 42.3 GB | 694 MB |
| Slowest grass step on the test machine       | 11 s    | 9.7 ms |

After, by view: 639 draw calls looking at the sun with every effect running,
574 looking away from it, 442 at night.

JavaScript allocation stayed at about 0.2 MB a second, so garbage collection
was never a stutter source.

### Smooth between steps

The world moves 60 times a second and the screen may draw 144. Drawn at the
last step, the view stood still for some frames and jumped for others — judder
that reads as an unsteady frame rate even at 60 Hz, whenever a frame arrives a
millisecond early or late. `GameRuntime.setFrameUpdate` runs once per drawn
frame, after the steps: the camera is placed between the last two steps by
how far the clock has got to the next (`SmoothedEye`), and the mouse turns the
view there, not in the step. The price is that the view is up to one step,
17 ms, behind the world — the standard trade from Glenn Fiedler's "Fix Your
Timestep!".

### Auto resolution

`AutoResolution` renders fewer pixels while frames run slow: it steps to 90, 80
and 70% of the menu's Render resolution, never above it, judging a second's
average at a time. Down after a second slower than 18 ms a frame; back up after
three seconds faster than 13.5 ms. Each change resizes every screen-sized
target and the clouds lose their blending, so the second after a change is not
judged and changes are always 2 s apart.

A slow frame is not always the GPU's. If a step down does not make frames at
least 5% faster, the time is going on the CPU and fewer pixels only blur the
picture: it steps back up and waits 15 s before trying again, doubling each
time up to 5 minutes. The stats panel shows the share being drawn. Tested
against three simulated machines: GPU-bound settles at 70%, CPU-bound ends at
full size after 10 changes in 5 minutes, and a fast one never changes.

### Passes that run only when they show something

| Pass                | Draw calls | Runs                                          |
| ------------------- | ---------- | --------------------------------------------- |
| Main view           | about 390  | every frame                                   |
| Sun shadow map      | 132        | while the sun is up                           |
| Halo (glow layer)   | about 150  | view only, sun or moon up and near the screen |
| God rays' occlusion | about 130  | sun up and near the screen                    |
| Mini-map picture    | about 55   | 20 times a second                             |
| Rain and snow       | 1 to 3     | only while something falls                    |

`scene.skipPointerMovePicking` is on: Babylon otherwise casts a ray into the
scene on every mouse move, up to a thousand a second with a gaming mouse, and
nothing here uses it.

### Not done yet

- **WebGPU's own speed-ups.** Babylon's WebGPU path spent more JavaScript per
  frame than WebGL here (12.7 ms against 8.5 ms, before these cuts).
  Non-compatibility mode and snapshot rendering can cut that, but snapshot
  rendering needs a scene whose meshes do not change, and this one streams.
- **Shutters as thin instances.** 78 of the main view's draws near the village
  are shutter leaves, each its own mesh.
- **Grass lean on the GPU.** Bent blades are still sent every step while
  walking, about 14 MB a second; a shader could bend them from the player's
  recent path with nothing sent at all.

## Water and the edge of the world

The sea is one see-through sheet to the horizon, with a dark floor under it.
The floor has to exist: the terrain stops at the edge of its grid, and
see-through water over nothing shows the sky.

| Depth                   | What happens                                       |
| ----------------------- | -------------------------------------------------- |
| Up to 1.1 m             | you wade, down to 40% of walking speed             |
| Over 1.2 m              | you cannot go deeper; wading back out always works |
| 60 m out from the beach | you are put back on the beach, facing land         |

**The shelf is shallow all the way out to the edge**, so the edge can be reached
on foot — that was the point. Beyond it the seabed drops away. The turn-back
fires 15 m short of that drop: a player stopped by deep water would be
standing in the sea with nothing to tell them why.

The edge is measured in distance from the coast, not from the middle of the
map, so it follows the island's shape — the same distance out from every
beach, bays and headlands included. Wading out takes about 22 seconds.

## Rivers

Three rivers, each coming out of a cave at the foot of a mountain and running
to the sea. Their courses are drawn by hand, as a handful of points each, then
curved through with Catmull-Rom and swung gently side to side. Rolling water
downhill would find its own way — and might find it through a hamlet, or
strand half the island.

|                |                                                                                      |
| -------------- | ------------------------------------------------------------------------------------ |
| Channel        | 8 m wide at the spring, 20 m at the mouth; 0.9 m deep at the spring, 2.3 m past 60 m |
| Fords          | 0.6 m deep over 20 m of river; wade straight across                                  |
| Bridges        | plank deck, railings, 0.7 m clear of the water                                       |
| Crossings      | 5 fords and 3 bridges, plus the shallow water by each spring                         |
| Steepest water | 7 degrees, on every river                                                            |

### Where the water level comes from

**Water cannot flow uphill.** A river's level is the lowest ground met so far
on the way down from its spring. Where it meets a rise it cuts through at the
level it already reached, which is how a gorge forms.

**It is the lowest ground across the whole width of the water**, 5 m past each
bank, not just under the middle. Measured down the centre line, a river
crossing a slope stood higher than its own downhill bank, and the water sheet
floated over the grass beside it.

**The water may fall at most 7 degrees.** Working back up from the sea, the
level can only climb so fast; where the ground rises faster the river stays
low and cuts in, the way a stream wears a gully. Without it the southern river
left its spring down a 43-degree sheet of water.

Each river is cut into the grid before any mesh is built — channel, bank, and a
valley either side — and **only ever lowers the ground**. A river that raised it
would build a dyke across every dip it crossed.

### The water's edge

The grid is 4 m across, and the triangle joining a deep sample in the bed to a
high one on the bank dips below the water just beyond the channel — up to
70 cm, measured. A water sheet that ends at the channel edge hangs in the air
there. So **each edge of the sheet steps outward until it meets ground above the
water**, and tucks under a real bank. Checked on every vertex of every river:
none hangs.

**The water level between grid points is blended, not taken from the nearest
one.** A river falls towards the sea, and stepping from one sample to the next
raised the level by up to half a metre at once. Near a shallow spring that
pushed "how deep is it here" over the wading limit for a single step, and
stopped the player dead in the middle of the stream, 12 m short of the cave.

### Springs

A height map holds one height per point, and a cave is a roof over a floor —
two heights at once — so the ground cannot make one. Each spring is built the
way games do it: separate rock set into the hillside.

- **A hill** is raised behind the spring, with a soft join to the slope so no
  crease runs down its side. It only ever raises, so a spring already set into
  a mountainside gets almost nothing.
- **Two rock pillars, a slab across them, and stones at their feet.** Each is a
  closed rock — a sphere pushed out to a rounded box and roughened with noise —
  so nothing about it can be seen through. Each stands on the lowest ground
  under it, not the ground under its middle, or it hangs over the slope.
- **Darkness behind**: an unlit black block filling the channel, so the water
  runs into it and is simply not seen again. It is solid, because walking in
  would show the inside of a black box.
- **The channel runs 8 m on into the hill**, level with the mouth, so the water
  goes on into the dark instead of stopping at the arch in a hard edge.

**A spring has to sit on level ground at the foot of its mountain.** High on a
flank, its first hundred metres ran downhill as a tilted sheet; on ground that
tilts across the stream, one bank rose beside the opening and the arch ended
up at the bottom of a trench. Each course starts where the ground is level
from bank to bank.

Crossings are placed along each river **on land**, source to where it meets the
sea. Measured along the whole drawn course, which runs on out past the beach,
a ford "70% along" landed in the open sea.

A bridge is boxes, like a house: level deck, plumb railing, nothing for the
solver to slide anyone down. It is built along x at the origin and then
turned — merged meshes come back with their world matrix frozen, so it is
thawed to be placed and frozen again after, or the turn is silently ignored.

## Rocks

420 loose stones, 0.5 m to 1.7 m across, and the rocks framing each spring.
Stones are thrown at the whole map and kept only where the ground has room for
them — dry, gentle, clear of houses and trees — so the scatter follows the
island without knowing it.

Only those within 250 m of the player exist at any moment — about 45 of them.
The rest are shapes waiting to be built; see
[Render distance and streaming](#render-distance-and-streaming).

### Two meshes per rock

**The rock you see does not collide.** What you bump into is an invisible
upright prism round the rock's outline: plumb sides, a level top, and no
material. It took getting it wrong to learn why each of those matters.

| Measured                                  | Before     | After    |
| ----------------------------------------- | ---------- | -------- |
| Walks into a stone that ended inside it   | 491 of 960 | 0 of 960 |
| Walks that left the player unable to move | 82         | 0        |
| Started inside a stone, could walk out    | —          | 60 of 60 |
| Cave-mouth rocks that trapped anyone      | —          | 0 of 26  |

- **Plumb sides.** Babylon's solver slides the player along whatever it hits,
  and along a rounded stone that slide runs downward. The ground is not in the
  solver, so nothing caught them: they sank below the ground, under the stone's
  buried edge.
- **No material.** `AbstractMesh` passes `!!subMesh.getMaterial()` to the
  collider as "test back faces too". A player under a visible stone found a
  wall in every direction and could not move — and saw the ground through it,
  because the inside of a rock is back faces, which are not drawn. A collider
  with no material is one-sided: from inside, every way is out.
- **Level top**, at three quarters of the stone's height, so a big stone can be
  stood on — stepped onto if it is low, climbed with Space if it is not.

The prism follows the stone's **body**: where it stands at least 30% of its
height. Out past that the stone is a skirt a few centimetres thick, half
buried, and a collider there would stop the player in thin air.

### Settling onto the ground

The same bug had a second way in. The step that keeps the feet down walking
downhill used to set the player's height straight onto the ground. Near its
edge a stone rises only a centimetre or two out of the ground, so "straight onto
the ground" was a centimetre inside the stone. Now every vertical move goes
through `moveWithCollisions`, and if anything stops it short, the feet stay
where it left them.

### No gap under a stone

Each stone is grown up from the ground under **each of its vertices**, not from
one height for the whole stone. On a slope, a stone set at one height hangs
over the downhill side and the gap under it shows the ground straight through.
Grown per vertex, the rim is sunk 0.35 m everywhere: of 2,191 outer points, none
stands above the ground.

**Grass meets a stone exactly where it comes out of the ground**, and is short
at its foot — see [Where grass meets things](#where-grass-meets-things). It was
once cleared in a square, which left a bald patch at every corner of every
round stone and still let blades up through its sides.

### Drawn inside out, and how that was caught

For two rounds every loose stone was drawn inside out: the faces towards you
were culled, and you saw the inside of the far wall. The winding had been
"fixed" by looking at a screenshot, and **an inside-out convex shape has the
same outline as a solid one** — the eye reads it as solid. It was caught by
putting a red, unlit ball inside a stone: it showed through. The faces are now
wound with their cross products pointing into the rock, Babylon's front face,
and a red ball inside a stone, inside a cave rock and under the terrain are all
hidden. Test winding that way, never by looking.

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
- **The roof mesh carries no collision.** It is a single sheet, and a sheet is
  something to fall through rather than something to stand on. An invisible
  solid behind it does the stopping — see below.

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

Past 150 m it is not drawn at all, and nor are the shutters — a 20 cm timber
is a pixel there, and every house carries a dozen draws of it. Window bolts,
their keepers and door bars go sooner, past 40 m: a bolt is a 1 by 4 pixel mark
there, and the 94 windows carry two each, which were drawn at any distance.

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

### The hamlets

Five more settlements are scattered 400 m to 800 m out, three cottages each
round a green rather than ten along a street, in `hamletLayout.ts`. Every door
faces the middle of its own green.

**They are not cheaper stand-ins.** They come out of the same `buildHouse`
call as the village, so walking twenty minutes towards a roof on the horizon
gets you a house with doors that open, shutters that work and a fire lit
inside. Only the small shapes are used — the barn, the longhouse and the hall
stay village property.

`settlements.ts` is the list everything else reads. Each entry carries a
`clearance`, which is how the terrain knows to lay level ground for it and the
stone scatter knows to keep off it: a settlement has no other way to announce
itself.

Twenty-five houses in total, built in 178 ms.

Each house is **two drawn meshes**: the four walls merged into one, and the
roof. Twenty-odd boxes per house would otherwise be twenty-odd draw calls each.
The merged wall mesh does the colliding itself — there is no hidden collider,
because the visible geometry is already nothing but thick axis-aligned boxes.

Ten houses cost 40 meshes and 47,143 vertices for the whole scene.

### The roof collider

`collideRoof.ts` adds one invisible mesh per house: the loft. Two roof planes on
top, a flat floor at the top of the walls, two triangles closing the gable ends.
**Eight triangles, six corners, ten houses.** It never renders and never casts a
shadow.

**This is the only sloping collider in the game**, and it took being wrong twice
to get here.

| Attempt            | What happened                                          |
| ------------------ | ------------------------------------------------------ |
| No collider        | you fall through the roof onto the floor               |
| Staircase of boxes | solid, but you sink into it and then creep up it       |
| Solid wedge        | you land on the surface, walk up and down it, stay put |

The staircase is the trick the tree colliders use, and it is wrong here for a
measurable reason. **The player's collision shape is an ellipsoid 0.4 m in
radius, and steps small enough to hide are a few centimetres.** An ellipsoid
resting on a staircase touches step _corners_, not step faces, and the contact
normal at a corner points sideways as well as up. Standing still, that slid the
player down the roof at 3.6 cm a second; moving, it wedged them between two
corners and squeezed them along.

That is not a tuning problem. An ellipsoid of radius `r` only rests stably on a
staircase when the step rise is under `r − √(r² − d²)` for step depth `d`. On
these 37° roofs that needs steps roughly `2r` deep — 0.8 m — which would stand
you 0.6 m above the shingles.

The reason to avoid a sloped collider does not reach a roof. The danger is that
a slope works like a ramp and lifts a player who walks into it; the lowest point
of this one is the top of the walls, **2.4 m up on the shortest house in the
village** — above a 1.11 m jump and above the 2.0 m a climb reaches. There is no
way to walk into it.

The collider stops at the walls, so the 0.4 m eave overhang is not solid. Out
there it would hang below the wall top and be an invisible thing to hit your
head on while walking round the house. Standing on a roof, the floor runs out
0.4 m before the edge you can see.

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
is invisible at map scale over ground that is already green, and it
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
blades that changed are sent to the GPU, with `thinInstancePartialBufferUpdate`.

Blades lean away from anything registered with `grass.addPusher(node)`, and
stand back up over 0.5 s. **Pushers are opt-in.** The ground and the walls are
never added, so the platform itself never flattens the grass.

A blade's offset, yaw and height come from a hash of the **world cell** it
stands in, not from its slot in the buffer. Walk away and back and every blade
is exactly where it was.

**The patch is a torus.** A blade's slot is its world cell modulo the patch
width, so sliding the patch rewrites only the blocks that genuinely entered it.
Rebuilding all of it cost 6.7 ms, which is a dropped frame every metre you walk.

**Blades are stored block by block** (`grassSlots.ts`), in squares one recentre
step wide, and every change is sent as a few short runs. This was the worst
stutter in the game. Row by row, a slide sent the whole buffer — 12.8 MB for the
near patch — and bent blades were sent as one run from the first to the last,
which near the patch's wrap-around line, every 40 m, was also the whole buffer,
every step. Measured over 400 m at a sprint:

|                | Sent to the GPU | Per second |
| -------------- | --------------- | ---------- |
| Row by row     | 42.3 GB         | 846 MB     |
| Block by block | 694 MB          | 14 MB      |

A test replays every upload onto a copy of the buffer and checks the copy
matches the CPU's exactly after the walk, so no changed blade is ever missed.

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

### Where grass meets things

Stones, trunks and walls each keep grass out with **their own shape**, and let
it grow back over 35 cm: none inside, 30% of full height right at the edge,
full height past the fade — the way grass really thins into the foot of a
stone. It used to be cleared in axis-aligned rectangles, so every round stone
and every trunk sat in a square bald patch, and blades grew up through the
stones' sides wherever the square was too small.

| Object | Shape                                                          |
| ------ | -------------------------------------------------------------- |
| Stone  | the line it comes out of the ground, measured in 64 directions |
| Trunk  | a circle the size of the trunk at the ground                   |
| House  | its walls and a 20 cm margin                                   |

A stone's outline comes from the same surface its mesh is built from, sunk rim
included. With 32 directions, 92 spots between them still let a blade through
the stone; with 64, none of the 420 stones does, checked at 64 directions and
every 2 cm out.

Blockers are sorted into a 4 m grid, so each blade asks the one or two near it.
Asking all 489 for every blade was a hundred million checks each time the grass
was laid out; the whole field is now laid out in about 75 ms.

## Trees

**Forty-four trees, four species**, grown from code. Each is a list of straight
segments produced by recursive branching, seeded from its own name so the wood is
identical on every load and no two trees are alike. About 275 segments and 4,700
leaves per tree, 206,800 leaves in all.

Positions are scattered rather than listed: points thrown at the platform and
kept if they are clear of the village, the spawn, the platform edge and every
tree already placed. Listing forty-four positions by hand would be forty-four
chances to overlap a house by two metres and not notice.

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

### Level of detail

| Tier | Range      | Leaves drawn | Drawn at      |
| ---- | ---------- | ------------ | ------------- |
| Near | under 32 m | all of them  | modelled size |
| Mid  | under 72 m | 45%          | 1.49x         |
| Far  | beyond     | 18%          | 2.36x         |

**The size compensation is the part that matters.** Thinning a canopy without it
makes distant trees look _bare_, which is worse than the cost it saves — a tree
in the distance should read as more solid, not less. Area goes as the square of
size, so drawing a share `s` of the leaves and scaling them by 1/sqrt(s) keeps
the coverage identical. Measured on one tree walked away from: 4,600 leaves at
0.205, then 2,070 at 0.306, then 828 at 0.483 — **coverage 193 at every tier**.

From the middle of the world that draws 73,110 leaves of 206,800.

Thresholds have five metres of slack, so a tree does not flicker between tiers
when you stand on a boundary. Changing a tier rewrites a whole canopy, so **only
one tree may change per step**; several at once would show as a hitch.

### Only nearby trees cast shadows

The shadow box is a fixed 48 m centred on the player, so a tree beyond it is
drawn into the shadow map every frame and casts nothing anyone can see. With
forty-four trees that is nearly all of them. Trees are added to and removed from
the map as they come within 32 m: **one tree in the map instead of forty-four**.

That needed new plumbing — `DayNightCycle` could add a shadow caster but never
remove one.

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

Building the wood costs **266 ms for forty-four trees**, and the whole world
549 ms.

It was 16 ms a tree slower than that. The collision shell was built as 368 box
meshes and merged, which is the obvious way to write it and cost **16 of the
23 ms** a tree took: making a Babylon mesh is expensive and there are 368 of them
in one tree. It is now stamped out as raw geometry from one box's vertices,
copied 368 times, which is arithmetic. 16 ms became 2.3 ms.

## Player

A 1.8 m capsule with the camera in its head at 1.62 m. Yaw turns the whole
body, pitch only tilts the view.

Movement runs on the fixed 60 Hz step, so walking speed does not change with
frame rate. Walking two directions at once is not faster than one.

Walk 4.5 m/s, run 8 m/s on Shift.

Jumping peaks at 1.11 m and lands after about 0.64 s. Two forgiveness windows
make it feel right: 0.12 s of coyote time after leaving the ground, and 0.12 s
of input buffering so a press just before landing still jumps.

### Air control

**Horizontal speed is state, not something recomputed from the keys every
step.** On the ground the legs set it outright, which is what makes walking feel
immediate. Off the ground there are no legs to push with, so the speed carried
off the ground is kept and only nudged, in `steerInAir.ts`.

Only the part of your speed already pointing where you are asking to go counts
against the limit. That one detail is what makes it feel right:

|                                            |                                                                             |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| Jump from a standstill, then press forward | you creep up to **2 m/s**, and cover **1.10 m** over the hop                |
| Walk the same 0.64 s on the ground         | **2.88 m**, so a jump is well under half                                    |
| Jump while sprinting at 8 m/s              | forward adds nothing, and you keep all **5.07 m** of it                     |
| Press sideways, either case                | full 2 m/s of steering, because sideways is a direction you had no speed in |

Momentum is never taken away in the air. Air braking belongs to the ground, and
the ground takes it back the instant the feet land.

### Travel speed

**World → Travel speed** multiplies walking and running, 1x to 8x, for crossing
a two-kilometre island. At 8x a sprint is 64 m/s, over a metre per step, and
still stops 0.40 m short of a house wall — Babylon's collision is swept, so it
does not step through a 0.35 m wall between one check and the next.

### Slopes you cannot stand on

**Babylon's solver has no idea what a slope is.** It pushes movement along
whatever it hits, so a player can walk straight up a sixty-degree rock face at
a metre a second. Anything leaning past about **48 degrees** is refused — on the
ground by reading the grid's slope, on meshes by one ray down each step in
`standableGround.ts`.

On the ground, walking into a slope too steep to climb takes away the uphill
part of the move and leaves the rest, so walking into a mountainside turns into
walking along it instead of stopping dead. Walking downhill, the feet are glued
to the ground as long as it falls away no faster than a walkable slope; without
that the player walks off the brow of every hill into a tiny fall.

Too steep is not treated as "blocked" but as **not ground at all**: it gives no
footing, so it brakes nothing, the drift is not taken back, and gravity goes on
building until the player is off it. House roofs are 37 degrees and stay
walkable, which is the one existing surface this had to leave alone.

### Stepping over things

**The solver has no step either.** Sliding along the vertical face of a kerb
removes every bit of the forward motion, so a **six-centimetre lip stops a
sprint dead** — at a bridge end, or the edge of a stone.

So a move that got less than 70% of what it asked for is tried again from
0.4 m higher, and the player is dropped back onto whatever they cleared. Two
rules keep it honest:

- 0.4 m is under the 0.5 m where a climb starts, so a step and a Space-press
  never argue about the same ledge.
- **The step only happens if the place it lands can be stood on.** Without
  that, a player facing a rock face could stair-step 40 cm at a time straight
  up it and the slope limit would mean nothing.

### Standing still means standing still

**Babylon's collision solver has no friction.** On a slope it answers the
downward push of gravity by sliding the player along the face. Measured on a
house roof: 4 cm a second, hands off the keys, which walks you off the eaves in
under a minute.

So when the floor stopped the fall and the player asked for no horizontal
movement, `PlayerController` puts x and z back where they were. Nothing asked
for that movement. Walking up or down a slope is untouched, because that
movement was asked for.

## Parkour

Line up with a wall and press **Space**. If there is a ledge in front of you,
you climb it instead of jumping; if there is not, you jump as before. One key,
two meanings, and it never fires when you did not ask.

|                  |                                                               |
| ---------------- | ------------------------------------------------------------- |
| Grabbable        | 0.5 m to 2.0 m above your feet — knee to 20 cm over your head |
| Broad top        | you end up standing on it                                     |
| Thin wall        | you go over and land on the far side                          |
| Works in mid-air | yes; jumping at a wall and grabbing the top is the point      |

### Finding a ledge

Four rays, in `src/player/findLedge.ts`.

1. **Face**, forward from **30 cm above the feet**. Cast from the chest it sails
   clean over a knee-high wall and finds nothing.
2. **Top**, down from 20 cm over your head, just past that face.
3. **Clearance**, up from the ledge.
4. **Landing**, down from 1.1 m past the face. Within 35 cm of the ledge and it
   is a platform to stand on; lower and it is a thin wall to cross, and this is
   where you land.

**Every ray carries a predicate, and it is not optional.** Everything solid here
is invisible, unpickable, or both — of the eleven solid meshes in the game only
the ground passes Babylon's default filter of enabled, visible and pickable.
Supplying a predicate replaces that filter entirely, so `mesh.checkCollisions`
picks exactly the world the player already collides with. No mesh flag anywhere
had to change.

### Standing room versus room to pass

To stand on a ledge you need to fit standing. To go _over_ something you only
need room to pass, so a vault asks for 90 cm rather than 1.85 m.

That one distinction is what makes **windows climbable**. The wall under a
window is a thin wall with a gap above it, which is precisely the case the move
is for. All 43 windows in the village can be vaulted through, and you land on
the floor inside. Demanding standing room refused every one of them.

Doors are refused, correctly — a doorway reaches the floor, so there is no ledge
to take hold of. You walk through.

**Nothing else in the village is climbable**: house walls are 2.4 m to 3.4 m,
which is over the limit by design.

### The climb

A scripted path, because `moveWithCollisions` cannot climb the very thing it
exists to stop you at. Writing the position directly needs nothing turned off: a
mesh's `checkCollisions` governs what other things do about it, not what it does
itself.

Two eased legs — 0.35 s up, 0.30 s over — and that is the whole animation. One
straight interpolation is a diagonal slide through the wall; up first and over
second is a climb.

The camera needs no special handling, because `syncCamera` rebuilds it from the
player's position every step. **Looking around stays free** during a climb:
taking the mouse away to play a cinematic fights the player's hand. The head bob
is fed no distance while climbing, or it reads the move as a sprint.

Finding a ledge costs 0.023 ms, and only runs when Space is pressed.

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

## World map

**`M` opens a painted map of the whole island**, with an arrow for where you
stand and which way you face; `M` or `Esc` closes it. Scroll to zoom, drag to
move. It opens centred on you and zoomed in, and zooms out to the whole island.

The game is **paused** while it is open. Opening it lets go of the mouse — the
same thing that pauses the game on `Esc` — and closing it takes the mouse back
inside the key press, which is the only moment the browser allows it. The
pause menu keeps out of the way while the map is up.

It is a flat map on old paper, painted from the island itself the first time
you open it — about half a second, once:

- the sea in a blue-green wash, with ripples ruled round the shore at every
  3 m of depth, and the coast as a thin ink line
- hills and mountains shaded in sepia as if lit from the north-west, drawn
  steeper than they are so gentle ground still reads, with snow caps left pale
- rivers inked in blue, every house as a little roofed block, every tree as a
  crown, every bridge as a plank
- a double ruled frame, a compass rose and a 500 m scale

The coast is drawn from depth over steepness — the distance to the waterline —
so it is a couple of pixels wide everywhere. Drawn from depth alone, the gently
sloping beaches made it a brown band 25 m wide.

**Names are text over the picture, not painted into it**, so they stay sharp
and the same size at any zoom: the village and the five hamlets, the three
rivers half way along their courses, and the mountains. The mountains have no
names anywhere else in the game; the map's are in `mapLabels.ts`.

## Mini-map

Bottom-left, 180 px square, **first person only**. Pressing `C` for the orbit
camera removes it entirely.

It is a real second camera, not a drawing, so it shows real geometry and real
lighting — but it draws **into its own texture, 20 times a second**, and that
picture is laid into the corner of every frame in one draw (`MiniMapPicture`).
It has **two poses**:

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

**Cost: about 55 draw calls, 20 times a second** — a third of a frame's worth at
60 frames a second. As a camera on the list it redrew itself, and its own copy
of the halo pass, every frame. The compass canvas is repainted with each new
picture, so the two always agree.

**A render target culls nothing.** Given no mesh list, Babylon's
`RenderTargetTexture` draws every enabled mesh on its camera's layers, however
far outside the view: the first version drew 144 to 263 draw calls per picture.
`ViewBoxFilter` hands it only the meshes inside the map camera's box.

The map's pixel size lives in `MINI_MAP_SIZE_CSS` and must match
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
src/world/     grass, clock, day/night cycle, sun and moon, the world's edge
src/world/terrain/   the island, its height grid, the sea, and rivers/
src/world/terrain/patches/  the ground's levels of detail, built round the player
src/world/sky/       the sky, the clouds, their weather and their shadows
src/world/rocks/     loose stones
src/player/    the bean, its camera, controls, collisions, footing on the ground
src/minimap/   the top-down camera and its overlay decorations
src/systems/   gameplay systems (empty)
src/ui/        React overlay + the bridge
src/assets/    glTF / KTX2 assets (empty)
```
