/**
 * The one thing every world object has in common.
 *
 * Deliberately shallow. A deep hierarchy makes it impossible to divide
 * behaviour cleanly once objects start sharing some traits but not others, and
 * a full entity-component system costs more than a game this size needs. This
 * is one base with three members, which is what the classes already in the
 * repository were informally doing anyway.
 *
 * `id` is a getter rather than a stored field on purpose. There will be
 * hundreds of thousands of leaves, and a string held on each of them would cost
 * more memory than the leaf itself.
 */
export abstract class WorldEntity {
  abstract get id(): string;

  /**
   * Called from the fixed simulation step. Optional: most entities are moved by
   * something above them and never need a tick of their own.
   */
  update?(seconds: number): void;

  /** Releases anything the entity owns. Handles onto shared buffers own nothing. */
  dispose(): void {}
}
