import type { ReactNode } from "react";

type SliderRowProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => ReactNode;
  onChange: (value: number) => void;
};

export function SliderRow({ label, value, min, max, step, format, onChange }: SliderRowProps) {
  return (
    <label className="setting">
      <span className="setting__label">{label}</span>
      <input
        className="setting__slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="setting__value">{format(value)}</span>
    </label>
  );
}
