/**
 * Where each blade of a grass patch lives in its buffer, and which parts of
 * that buffer still have to be sent to the GPU.
 *
 * Blades are stored block by block, not row by row. The patch is cut into
 * square blocks exactly one recentre step wide, and each block's blades sit
 * together in the buffer. Sliding the patch replaces whole blocks, and the
 * blades round a pusher fall in a handful of blocks, so every change is a few
 * short runs of the buffer.
 *
 * Row by row, a change was sent as one run from the first changed blade to
 * the last. Any step across the patch's wrap-around line — every 40 m on the
 * near patch — made that run the whole 12.8 MB buffer, sent every step.
 */
export class GrassSlots {
  private readonly blocksPerSide: number;
  private readonly bladesPerBlock: number;
  /** Per block, the lowest and highest changed blade, counted within the block. */
  private readonly lowest: Int32Array;
  private readonly highest: Int32Array;
  private readonly changedBlocks: number[] = [];

  constructor(
    patchCells: number,
    private readonly blockCells: number,
  ) {
    if (patchCells % blockCells !== 0) {
      throw new Error(`A ${patchCells}-cell patch does not cut into ${blockCells}-cell blocks`);
    }
    this.blocksPerSide = patchCells / blockCells;
    this.bladesPerBlock = blockCells * blockCells;
    const blocks = this.blocksPerSide * this.blocksPerSide;
    this.lowest = new Int32Array(blocks).fill(this.bladesPerBlock);
    this.highest = new Int32Array(blocks).fill(-1);
  }

  /** The slot of the blade at a patch column and row, each 0 up to the patch width. */
  slotOf(column: number, row: number): number {
    const blockColumn = Math.floor(column / this.blockCells);
    const blockRow = Math.floor(row / this.blockCells);
    const block = blockRow * this.blocksPerSide + blockColumn;
    const within = (row - blockRow * this.blockCells) * this.blockCells;
    return block * this.bladesPerBlock + within + column - blockColumn * this.blockCells;
  }

  columnOf(slot: number): number {
    const block = Math.floor(slot / this.bladesPerBlock);
    const within = slot - block * this.bladesPerBlock;
    return (block % this.blocksPerSide) * this.blockCells + (within % this.blockCells);
  }

  rowOf(slot: number): number {
    const block = Math.floor(slot / this.bladesPerBlock);
    const within = slot - block * this.bladesPerBlock;
    const blockRow = Math.floor(block / this.blocksPerSide);
    return blockRow * this.blockCells + Math.floor(within / this.blockCells);
  }

  /** Notes that a blade's transform changed and must be sent. */
  markChanged(slot: number): void {
    const block = Math.floor(slot / this.bladesPerBlock);
    const within = slot - block * this.bladesPerBlock;
    if ((this.highest[block] ?? -1) < 0) this.changedBlocks.push(block);
    this.lowest[block] = Math.min(this.lowest[block] ?? within, within);
    this.highest[block] = Math.max(this.highest[block] ?? within, within);
  }

  /**
   * Hands every changed run to `send`, as a first slot and a count, then
   * forgets them. Runs up to a block apart are joined: resending one block
   * costs less than another upload call.
   */
  flush(send: (firstSlot: number, count: number) => void): void {
    if (this.changedBlocks.length === 0) return;
    this.changedBlocks.sort((a, b) => a - b);
    let start = -1;
    let end = -1;
    for (const block of this.changedBlocks) {
      const from = block * this.bladesPerBlock + (this.lowest[block] ?? 0);
      const to = block * this.bladesPerBlock + (this.highest[block] ?? 0);
      this.lowest[block] = this.bladesPerBlock;
      this.highest[block] = -1;
      if (start >= 0 && from - end - 1 <= this.bladesPerBlock) {
        end = to;
        continue;
      }
      if (start >= 0) send(start, end - start + 1);
      start = from;
      end = to;
    }
    send(start, end - start + 1);
    this.changedBlocks.length = 0;
  }
}
