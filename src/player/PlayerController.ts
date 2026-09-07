import { TargetCamera } from "@babylonjs/core/Cameras/targetCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { createPlayerBean, PLAYER_EYE_HEIGHT, PLAYER_HEIGHT } from "./createPlayerBean";
import { ClimbMove } from "./ClimbMove";
import { findLedge } from "./findLedge";
import type { PlayerInput } from "./PlayerInput";
import { steerInAir } from "./steerInAir";
import { HeadBob } from "./HeadBob";

const WALK_SPEED = 4.5;
/** Holding Shift. About 1.8x walking, roughly a real sprint. */
const RUN_SPEED = 8;
const GRAVITY = -22;
/** Radians of turn per pixel of mouse movement. */
const LOOK_SENSITIVITY = 0.0022;
const MAX_PITCH = (85 * Math.PI) / 180;
/** Eye position measured from the capsule's centre, not from the ground. */
const EYE_OFFSET = PLAYER_EYE_HEIGHT - PLAYER_HEIGHT / 2;
/** Slack for float noise when comparing intended fall against actual fall. */
const GROUND_EPSILON = 1e-4;
/**
 * The collision solver leaves a few millimetres between the feet and the floor,
 * so contact alternates on and off every step. Holding the flag briefly makes
 * standing still read as grounded, which is what a jump will need.
 */
const COYOTE_SECONDS = 0.12;

const JUMP_KEY = "Space";
/**
 * Upward speed at take-off. With gravity at -22 this peaks at 1.11 m, a little
 * over knee height on a 1.8 m body, and lands again after about 0.64 s.
 */
const JUMP_SPEED = 7;
/**
 * How long a jump press is remembered. Pressing Space just before landing then
 * jumps on touchdown instead of being thrown away, which is the difference
 * between a jump that feels responsive and one that feels like it missed.
 */
const JUMP_BUFFER_SECONDS = 0.12;

/**
 * Walks the bean and keeps the first-person camera in its head.
 *
 * Yaw turns the whole body, pitch only tilts the view, which is how every
 * first-person game behaves. Movement runs on the fixed step, so walking speed
 * does not change with frame rate.
 */
export class PlayerController {
  readonly bean: Mesh;
  readonly camera: TargetCamera;

  private yaw = 0;
  private pitch = 0;
  private verticalSpeed = 0;
  private grounded = false;
  private groundedTimer = 0;
  private jumpBufferTimer = 0;
  private readonly displacement = new Vector3();
  /** Horizontal speed, kept between steps so a jump carries its run with it. */
  private readonly velocity = new Vector3();
  private readonly headBob = new HeadBob();
  private sensitivityScale = 1;
  private invertLook = false;
  /** Set while hauling over a ledge. Nothing else moves the player meanwhile. */
  private climb: ClimbMove | null = null;

  constructor(
    private readonly scene: Scene,
    private readonly input: PlayerInput,
  ) {
    this.bean = createPlayerBean(scene);
    this.camera = new TargetCamera("player-camera", new Vector3(0, PLAYER_EYE_HEIGHT, 0), scene);
    this.camera.minZ = 0.1;
    this.camera.maxZ = 2000;

    // Required because the head bob writes rotation.z. Babylon only refreshes a
    // camera's up vector when rotation.z CHANGES, and it bakes the yaw and pitch
    // of that moment into it. The bob's roll settles to exactly zero in the air,
    // so the up vector froze and every mouse movement after that rolled the
    // horizon over. Deriving it from the rotation every frame is exact.
    this.camera.updateUpVectorFromRotation = true;
    this.syncCamera();
  }

  /** Multiplies the base look speed. 1 is the built-in feel. */
  setLookSensitivity(scale: number): void {
    this.sensitivityScale = Math.max(0.05, scale);
  }

  setInvertLook(invert: boolean): void {
    this.invertLook = invert;
  }

  setHeadBobStrength(strength: number): void {
    this.headBob.setStrength(strength);
  }

  get isGrounded(): boolean {
    return this.grounded;
  }

  get isClimbing(): boolean {
    return this.climb !== null;
  }

  update(fixedDeltaSeconds: number): void {
    // Looking around stays free during a climb. Taking the mouse away to play a
    // cinematic fights the player's hand, which is worse than any camera move
    // is worth.
    this.applyLook();

    if (this.climb) {
      this.advanceClimb(fixedDeltaSeconds);
      this.syncCamera();
      return;
    }

    this.applyJump(fixedDeltaSeconds);
    this.applyMovement(fixedDeltaSeconds);
    this.syncCamera();
  }

  /**
   * Moves the player along the scripted path, then hands control back with no
   * vertical speed, so a vault that ends in the air simply falls.
   */
  private advanceClimb(seconds: number): void {
    this.climb?.advance(seconds, this.bean.position);
    // Fed no distance: the bob is driven by ground covered, and a climb would
    // read to it as a sprint.
    this.headBob.advance(seconds, 0, false);
    if (!this.climb?.isDone) return;
    this.climb = null;
    this.verticalSpeed = 0;
    this.velocity.set(0, 0, 0);
    this.groundedTimer = 0;
    this.grounded = false;
  }

  /**
   * Runs before movement so the take-off speed is spent on this step, and reads
   * the grounded flag left by the previous step, which is what coyote time is
   * there to keep honest.
   */
  private applyJump(seconds: number): void {
    if (this.input.consumePress(JUMP_KEY)) {
      this.jumpBufferTimer = JUMP_BUFFER_SECONDS;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - seconds);
    }

    if (this.jumpBufferTimer <= 0) return;

    // A ledge beats a jump, and works in mid-air too: jumping at a wall and
    // grabbing the top of it is the point of the move.
    const ledge = findLedge(this.scene, this.bean, this.yaw);
    if (ledge) {
      this.climb = new ClimbMove(this.bean.position, ledge);
      this.jumpBufferTimer = 0;
      return;
    }

    if (!this.grounded) return;

    this.verticalSpeed = JUMP_SPEED;
    this.jumpBufferTimer = 0;
    // Spend the coyote grace too, or the buffered press could fire twice.
    this.groundedTimer = 0;
    this.grounded = false;
  }

  private applyLook(): void {
    const look = this.input.takeLook();
    const speed = LOOK_SENSITIVITY * this.sensitivityScale;
    const vertical = this.invertLook ? -look.y : look.y;
    this.yaw += look.x * speed;
    this.pitch = Math.min(MAX_PITCH, Math.max(-MAX_PITCH, this.pitch + vertical * speed));
    this.bean.rotation.y = this.yaw;
  }

  private applyMovement(seconds: number): void {
    // With yaw 0 the body faces +z, so forward is (sin, 0, cos) and right is
    // (cos, 0, -sin).
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    const forward = this.input.forward;
    const strafe = this.input.strafe;

    let moveX = forward * sin + strafe * cos;
    let moveZ = forward * cos - strafe * sin;
    // Walking two directions at once must not be faster than walking one.
    const length = Math.hypot(moveX, moveZ);
    if (length > 1) {
      moveX /= length;
      moveZ /= length;
    }

    // On the ground the legs set the speed outright, which is what makes
    // walking feel immediate. In the air there are no legs to push with, so the
    // speed carried off the ground is kept and only nudged.
    if (this.grounded) {
      const groundSpeed = this.input.isRunning ? RUN_SPEED : WALK_SPEED;
      this.velocity.x = moveX * groundSpeed;
      this.velocity.z = moveZ * groundSpeed;
    } else {
      steerInAir(this.velocity, moveX, moveZ, seconds);
    }

    this.verticalSpeed += GRAVITY * seconds;

    this.displacement.set(
      this.velocity.x * seconds,
      this.verticalSpeed * seconds,
      this.velocity.z * seconds,
    );

    // moveWithCollisions starts from the world matrix, not from .position. The
    // simulation step runs before the render, so without this the matrix is a
    // frame stale and the collision solver works from the wrong place.
    this.bean.computeWorldMatrix(true);

    const beforeX = this.bean.position.x;
    const beforeY = this.bean.position.y;
    const beforeZ = this.bean.position.z;
    this.bean.moveWithCollisions(this.displacement);

    // Falling freely, the actual drop equals the intended one. Anything less
    // means the floor got in the way.
    const actualDrop = this.bean.position.y - beforeY;
    const floorStoppedTheFall =
      this.verticalSpeed < 0 && actualDrop > this.displacement.y + GROUND_EPSILON;

    // Standing still has to mean standing still. Babylon's solver has no
    // friction: on a slope it answers the downward push of gravity by sliding
    // the player along the face, so a roof carries you off itself at 4 cm a
    // second with your hands off the keys. Nothing asked for that movement, so
    // it is given back. Walking up or down a slope is untouched, because that
    // movement was asked for.
    const askedToMove = this.displacement.x !== 0 || this.displacement.z !== 0;
    if (floorStoppedTheFall && !askedToMove) {
      this.bean.position.x = beforeX;
      this.bean.position.z = beforeZ;
    }

    if (floorStoppedTheFall) {
      this.verticalSpeed = 0;
      this.groundedTimer = COYOTE_SECONDS;
    } else {
      this.groundedTimer = Math.max(0, this.groundedTimer - seconds);
    }
    this.grounded = this.groundedTimer > 0;

    // Distance actually covered, not distance asked for: walking into a wall
    // must stop the bob rather than keep it cycling on the spot.
    const coveredX = this.bean.position.x - beforeX;
    const coveredZ = this.bean.position.z - beforeZ;
    this.headBob.advance(seconds, Math.hypot(coveredX, coveredZ), this.grounded);
  }

  private syncCamera(): void {
    // Sway is sideways in the body's own frame, so it rides the right vector.
    const sway = this.headBob.lateralOffset;
    this.camera.position.set(
      this.bean.position.x + Math.cos(this.yaw) * sway,
      this.bean.position.y + EYE_OFFSET + this.headBob.verticalOffset,
      this.bean.position.z - Math.sin(this.yaw) * sway,
    );
    this.camera.rotation.set(this.pitch, this.yaw, this.headBob.roll);
  }
}
