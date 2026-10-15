/**
 * One of the big names, as a button.
 *
 * The whole button leans, not only the word in it, so the place you can click
 * follows the word you read: a leaning word in an upright box would hang its
 * tail over the next name's box, and clicking the end of CONTROLS would open
 * GAMEPLAY.
 */
export function SectionButton({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <button type="button" className="menu__name" onClick={onClick}>
      <span>{name}</span>
    </button>
  );
}
