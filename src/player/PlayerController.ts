import { TargetCamera } from "@babylonjs/core/Cameras/targetCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { createPlayerBean, PLAYER_EYE_HEIGHT, PLAYER_HEIGHT } from "./createPlayerBean";
import type { PlayerInput } from "./PlayerInput";

const WALK_SPEED = 4.5;
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
  private readonly displacement = new Vector3();

  constructor(
    scene: Scene,
    private readonly input: PlayerInput,
  ) {
    this.bean = createPlayerBean(scene);
    this.camera = new TargetCamera("player-camera", new Vector3(0, PLAYER_EYE_HEIGHT, 0), scene);
    this.camera.minZ = 0.1;
    this.camera.maxZ = 2000;
    this.syncCamera();
  }

  get isGrounded(): boolean {
    return this.grounded;
  }

  update(fixedDeltaSeconds: number): void {
    this.applyLook();
    this.applyMovement(fixedDeltaSeconds);
    this.syncCamera();
  }

  private applyLook(): void {
    const look = this.input.takeLook();
    this.yaw += look.x * LOOK_SENSITIVITY;
    this.pitch = Math.min(MAX_PITCH, Math.max(-MAX_PITCH, this.pitch + look.y * LOOK_SENSITIVITY));
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

    this.verticalSpeed += GRAVITY * seconds;

    this.displacement.set(
      moveX * WALK_SPEED * seconds,
      this.verticalSpeed * seconds,
      moveZ * WALK_SPEED * seconds,
    );

    // moveWithCollisions starts from the world matrix, not from .position. The
    // simulation step runs before the render, so without this the matrix is a
    // frame stale and the collision solver works from the wrong place.
    this.bean.computeWorldMatrix(true);

    const beforeY = this.bean.position.y;
    this.bean.moveWithCollisions(this.displacement);

    // Falling freely, the actual drop equals the intended one. Anything less
    // means the floor got in the way.
    const actualDrop = this.bean.position.y - beforeY;
    const floorStoppedTheFall =
      this.verticalSpeed < 0 && actualDrop > this.displacement.y + GROUND_EPSILON;

    if (floorStoppedTheFall) {
      this.verticalSpeed = 0;
      this.groundedTimer = COYOTE_SECONDS;
    } else {
      this.groundedTimer = Math.max(0, this.groundedTimer - seconds);
    }
    this.grounded = this.groundedTimer > 0;
  }

  private syncCamera(): void {
    this.camera.position.set(
      this.bean.position.x,
      this.bean.position.y + EYE_OFFSET,
      this.bean.position.z,
    );
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }
}
