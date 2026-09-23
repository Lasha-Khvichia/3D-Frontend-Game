/**
 * The cheapest-first queue a route finder runs on: a binary heap of squares
 * and what the walk through them is guessed to cost.
 *
 * A sorted array would do the same job, but re-sorting it on every step turns
 * a search over forty thousand squares into a minute of work.
 */
export class CostQueue {
  private readonly at: number[] = [];
  private readonly guess: number[] = [];

  get isEmpty(): boolean {
    return this.at.length === 0;
  }

  push(cell: number, guess: number): void {
    this.at.push(cell);
    this.guess.push(guess);
    let child = this.at.length - 1;
    while (child > 0) {
      const parent = (child - 1) >> 1;
      if ((this.guess[parent] ?? 0) <= (this.guess[child] ?? 0)) break;
      this.swap(parent, child);
      child = parent;
    }
  }

  /** The cheapest square in the queue, or -1 when there is none left. */
  take(): number {
    if (this.at.length === 0) return -1;
    const best = this.at[0]!;
    const lastAt = this.at.pop()!;
    const lastGuess = this.guess.pop()!;
    if (this.at.length > 0) {
      this.at[0] = lastAt;
      this.guess[0] = lastGuess;
      this.sink(0);
    }
    return best;
  }

  private sink(from: number): void {
    const count = this.at.length;
    let parent = from;
    for (;;) {
      const left = parent * 2 + 1;
      const right = left + 1;
      let smallest = parent;
      if (left < count && (this.guess[left] ?? 0) < (this.guess[smallest] ?? 0)) smallest = left;
      if (right < count && (this.guess[right] ?? 0) < (this.guess[smallest] ?? 0)) smallest = right;
      if (smallest === parent) return;
      this.swap(parent, smallest);
      parent = smallest;
    }
  }

  private swap(one: number, other: number): void {
    [this.at[one], this.at[other]] = [this.at[other]!, this.at[one]!];
    [this.guess[one], this.guess[other]] = [this.guess[other]!, this.guess[one]!];
  }
}
