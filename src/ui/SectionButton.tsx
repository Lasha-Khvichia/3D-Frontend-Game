/**
 * One of the four big names, as a button.
 *
 * The lean lives on the inner span, not the button: a rotated box still takes
 * up the room it had upright, so the button keeps an upright block tall enough
 * for the word to lean inside without climbing into the one above. How much
 * room that is depends on the word's length, which is what `data-short` is
 * for — SOUND drops half as far as GRAPHICS.
 */
export function SectionButton({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <button type="button" className="menu__name" data-short={name.length <= 5} onClick={onClick}>
      <span>{name}</span>
    </button>
  );
}
