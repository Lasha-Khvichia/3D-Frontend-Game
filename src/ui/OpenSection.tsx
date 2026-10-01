import { useEffect, useState, type ComponentType } from "react";

/**
 * One settings section, opened.
 *
 * Its name arrives first, rising to the top and straightening out of the lean
 * it had in the list; the rows then follow it in, each a little after the one
 * above.
 *
 * The arrival is a transition thrown by an attribute, not a keyframe: a
 * keyframe starts when the element is inserted, which is before the browser
 * has drawn the state it should start from. The attribute is set a frame
 * later, so there are two states to travel between.
 *
 * Both ways back are here: the Back line, and the name itself.
 */
export function OpenSection({
  name,
  Rows,
  onBack,
}: {
  name: string;
  Rows: ComponentType;
  onBack: () => void;
}) {
  const arrived = useArrived();

  return (
    <div className="menu__open" data-arrived={arrived}>
      <button type="button" className="menu__back" onClick={onBack}>
        &lsaquo; Back
      </button>
      <button type="button" className="menu__open-name" onClick={onBack}>
        {name}
      </button>
      <div className="menu__rows">
        <Rows />
      </div>
    </div>
  );
}

/** Long enough for the browser to have drawn the starting state, short enough
 *  that nobody sees it wait. */
const FIRST_PAINT_MS = 20;

/** False until the starting state has been drawn, true after. */
function useArrived(): boolean {
  const [arrived, setArrived] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setArrived(true), FIRST_PAINT_MS);
    return () => window.clearTimeout(timer);
  }, []);
  return arrived;
}
