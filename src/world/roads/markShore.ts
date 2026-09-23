/**
 * Marks every dry square that touches water.
 *
 * A road laid along the very lip of a river has nowhere to bend when it is
 * rounded off, and ends up in the water; charging it to run on the bank keeps
 * it a square back, where there is room to curve.
 */
export function markShore(cells: number, blocked: Uint8Array, bridged: Uint8Array): Uint8Array {
  const shore = new Uint8Array(cells * cells);
  for (let row = 0; row < cells; row += 1) {
    for (let column = 0; column < cells; column += 1) {
      const at = row * cells + column;
      if (blocked[at] || bridged[at]) continue;
      for (let down = -1; down <= 1 && !shore[at]; down += 1) {
        for (let across = -1; across <= 1; across += 1) {
          const near = (row + down) * cells + column + across;
          if (blocked[near] && !bridged[near]) shore[at] = 1;
        }
      }
    }
  }
  return shore;
}
