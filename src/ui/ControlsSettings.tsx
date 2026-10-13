import { CONTROLS } from "./controlsList";

/** Every key and what it does. Rows only: the menu owns the name above them. */
export function ControlsSettings() {
  return (
    <>
      {CONTROLS.map((control) => (
        <div className="keyrow" key={control.keys}>
          <span className="keyrow__keys">{control.keys}</span>
          <span className="keyrow__does">{control.does}</span>
        </div>
      ))}
    </>
  );
}
