type HoneypotFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function HoneypotField({ value, onChange }: HoneypotFieldProps) {
  return (
    <label className="honeypot-field" aria-hidden="true">
      Website
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
