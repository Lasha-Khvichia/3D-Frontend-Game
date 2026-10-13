import { itemKind } from "../items/itemKinds";
import type { Stack } from "../items/slots";

/**
 * One slot, anywhere: on the bar, in the bag, in the off hand or on the belt.
 *
 * It is both a drag source and a drop target, so the same component is every
 * end of every move and there is no second set of rules to keep in step.
 */
export function ItemSlot({
  slot,
  stack,
  chosen,
  label,
  onMove,
  onChoose,
}: {
  slot: number;
  stack: Stack;
  chosen?: boolean | undefined;
  label?: string | undefined;
  onMove?: ((from: number, to: number) => void) | undefined;
  onChoose?: ((slot: number) => void) | undefined;
}) {
  const kind = stack ? itemKind(stack.id) : null;
  return (
    <button
      type="button"
      className="slot"
      data-chosen={chosen === true}
      data-filled={kind !== null}
      title={kind?.name ?? label ?? ""}
      draggable={kind !== null && onMove !== undefined}
      onDragStart={(event) => event.dataTransfer.setData("text/plain", String(slot))}
      onDragOver={(event) => onMove && event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const from = Number(event.dataTransfer.getData("text/plain"));
        if (Number.isInteger(from)) onMove?.(from, slot);
      }}
      onClick={() => onChoose?.(slot)}
    >
      {kind ? (
        <span className="slot__mark" style={{ ["--tint" as string]: kind.tint }}>
          {kind.mark}
        </span>
      ) : (
        <span className="slot__empty">{label ?? ""}</span>
      )}
      {stack && stack.count > 1 ? <span className="slot__count">{stack.count}</span> : null}
    </button>
  );
}
