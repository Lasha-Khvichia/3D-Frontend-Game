import { useGameStats } from "./useGameStats";

/**
 * Shown when the game could not start at all — almost always because the
 * browser has switched 3D graphics off.
 *
 * Without it the overlay, which is drawn before the engine is asked for, sits
 * on a pause menu over a game that never existed, and nothing answers a click.
 * Chrome turns WebGL off for the rest of a session after its graphics process
 * has crashed a few times, which is why a full restart of the browser is the
 * first thing to try.
 */
export function StartFailure() {
  const { startFailure } = useGameStats();
  if (!startFailure) return null;

  return (
    <div className="start-failure">
      <div className="start-failure__card">
        <h2 className="start-failure__title">The game could not start</h2>
        <p>
          Your browser would not give it any 3D graphics. That is the browser, not the game, and it
          is usually fixed in a minute.
        </p>
        <ol className="start-failure__steps">
          <li>Close every browser window, so the browser fully quits. Then open it again.</li>
          <li>
            Still here? Turn on <b>Use graphics acceleration when available</b> in the browser's
            settings, under System, and relaunch.
          </li>
          <li>
            In Chrome, <code>chrome://gpu</code> shows whether WebGL is on, and why not.
          </li>
        </ol>
        <p className="start-failure__detail">{startFailure}</p>
      </div>
    </div>
  );
}
