type ToggleRowProps = {
  label: string;
  value: boolean;
  onLabel?: string;
  offLabel?: string;
  onChange: (value: boolean) => void;
};

export function ToggleRow({ label, value, onLabel, offLabel, onChange }: ToggleRowProps) {
  return (
    <label className="setting">
      <span className="setting__label">{label}</span>
      <input
        className="setting__toggle"
        type="checkbox"
        checked={value}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="setting__value">{value ? (onLabel ?? "On") : (offLabel ?? "Off")}</span>
    </label>
  );
}
