type Choice<T extends string> = { value: T; label: string };

type ChoiceRowProps<T extends string> = {
  label: string;
  value: T;
  choices: readonly Choice<T>[];
  onChange: (value: T) => void;
};

/** Buttons rather than a dropdown: one click, and it reads at a glance. */
export function ChoiceRow<T extends string>({
  label,
  value,
  choices,
  onChange,
}: ChoiceRowProps<T>) {
  return (
    <div className="setting">
      <span className="setting__label">{label}</span>
      <div className="setting__choices">
        {choices.map((choice) => (
          <button
            key={choice.value}
            type="button"
            className={choice.value === value ? "setting__choice is-active" : "setting__choice"}
            onClick={(event) => {
              onChange(choice.value);
              event.currentTarget.blur();
            }}
          >
            {choice.label}
          </button>
        ))}
      </div>
    </div>
  );
}
