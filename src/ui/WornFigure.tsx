import { BELT, OFF_HAND, type Stack } from "../items/slots";
import { ItemSlot } from "./ItemSlot";

/**
 * You, seen from behind as you are in the game, with the two places a thing
 * is worn put where they really are: the left hand at your left side, the belt
 * at your waist.
 *
 * From behind, so your left is on the left of the picture. A figure facing out
 * would put its left hand on the right, and a slot marked "Left hand" on the
 * right-hand side reads as a mistake.
 */
export function WornFigure({
  inventory,
  onMove,
}: {
  inventory: readonly Stack[];
  onMove: (from: number, to: number) => void;
}) {
  return (
    <figure className="figure">
      <svg className="figure__body" viewBox="0 0 160 260" aria-hidden="true">
        <circle cx="80" cy="34" r="20" />
        <path d="M70 54 L90 54 L92 64 L68 64 Z" />
        <path d="M50 70 Q80 58 110 70 L118 150 L42 150 Z" />
        <path d="M50 74 L30 150 L38 154 L58 92" />
        <path d="M110 74 L130 150 L122 154 L102 92" />
        <path d="M54 150 L62 248 L76 248 L80 170 L84 248 L98 248 L106 150 Z" />
        <rect className="figure__belt" x="42" y="136" width="76" height="9" rx="2" />
      </svg>
      <div className="figure__slot figure__slot--hand">
        <ItemSlot
          slot={OFF_HAND}
          stack={inventory[OFF_HAND] ?? null}
          label="Hand"
          onMove={onMove}
        />
        <span className="figure__label">Left hand</span>
      </div>
      <div className="figure__slot figure__slot--belt">
        <ItemSlot slot={BELT} stack={inventory[BELT] ?? null} label="Belt" onMove={onMove} />
        <span className="figure__label">Belt</span>
      </div>
    </figure>
  );
}
