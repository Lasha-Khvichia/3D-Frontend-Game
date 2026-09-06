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
 *
 * There is deliberately **no `update`** here. Every system in this game needs
 * different context to advance — a delta, or a delta and where the player is,
 * or a delta and which keys were pressed — and forcing one signature on all of
 * them is the exact rigidity a shallow base is supposed to avoid. The
 * simulation step in `main.ts` calls each system with what it actually needs.
 */
export abstract class WorldEntity {
  abstract get id(): string;

  /** Releases anything the entity owns. Handles onto shared buffers own nothing. */
  dispose(): void {}
}
