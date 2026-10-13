import type { Boar } from "./Boar";

/** Metres: nearer than this a calm boar backs away; past this it stops. */
const WARY_AT = 12;
const SAFE_AT = 18;
/** Metres past which an angry boar gives up the chase. */
const CHASE_LIMIT = 30;
/** Metres round its den a calm boar wanders. */
const HOME_RANGE = 34;
/** Metres per second for each way a boar moves. */
const PACE = { walk: 1.7, back: 3.2, charge: 6.4, recover: 1.8, flee: 5.6 } as const;

/**
 * What a boar decides to do this step, given where you are.
 *
 * Calm, it roots about and wanders near its den, and backs off if you come
 * close: the easiest enemy, which you can walk past. Cut it and it turns and
 * charges; hurt it badly and it runs. A charge that lands sends it back a few
 * paces (`recover`) before it comes again, so a fight is a matter of timing.
 */
export function thinkFor(
  boar: Boar,
  playerX: number,
  playerZ: number,
  seconds: number,
  random: () => number,
): void {
  boar.moodTime += seconds;
  boar.anger = Math.max(0, boar.anger - seconds);
  const toPlayer = Math.hypot(playerX - boar.x, playerZ - boar.z);
  if (boar.mood === "dead") return;

  if (boar.mood === "charge") {
    if (boar.anger <= 0 || toPlayer > CHASE_LIMIT) return settle(boar);
    return head(boar, playerX, playerZ, PACE.charge);
  }
  if (boar.mood === "recover" || boar.mood === "flee") {
    away(boar, playerX, playerZ, boar.mood === "flee" ? PACE.flee : PACE.recover);
    if (boar.moodTime < boar.moodLength) return;
    if (boar.mood === "recover" && boar.anger > 0) return boar.setMood("charge", 6);
    return settle(boar);
  }

  // Calm from here on.
  if (toPlayer < WARY_AT || (boar.mood === "wary" && toPlayer < SAFE_AT)) {
    if (boar.mood !== "wary") boar.setMood("wary", 0);
    return away(boar, playerX, playerZ, PACE.back);
  }
  if (boar.mood === "wary") return settle(boar);

  const arrived = Math.hypot(boar.targetX - boar.x, boar.targetZ - boar.z) < 1;
  if (boar.mood === "wander" && !arrived && boar.moodTime < boar.moodLength) {
    return head(boar, boar.targetX, boar.targetZ, PACE.walk);
  }
  if (boar.mood === "root" && boar.moodTime < boar.moodLength) {
    boar.pace = 0;
    return;
  }
  if (boar.mood === "root") {
    const angle = random() * Math.PI * 2;
    const far = random() * HOME_RANGE;
    boar.targetX = boar.den.x + Math.sin(angle) * far;
    boar.targetZ = boar.den.z + Math.cos(angle) * far;
    return boar.setMood("wander", 6 + random() * 4);
  }
  settle(boar, 1.5 + random() * 3);
}

/** Calms down and roots where it stands. */
function settle(boar: Boar, seconds = 3): void {
  boar.pace = 0;
  boar.setMood("root", seconds);
}

function head(boar: Boar, x: number, z: number, pace: number): void {
  boar.targetX = x;
  boar.targetZ = z;
  boar.pace = pace;
}

/** Makes for a point ten metres further from you, straight away. */
function away(boar: Boar, fromX: number, fromZ: number, pace: number): void {
  const length = Math.hypot(boar.x - fromX, boar.z - fromZ) || 1;
  head(
    boar,
    boar.x + ((boar.x - fromX) / length) * 10,
    boar.z + ((boar.z - fromZ) / length) * 10,
    pace,
  );
}
