type Option = { value: string; label: string; description?: string };
type Props = { name: string; value: string; onChange: (value: string) => void; options: Option[]; label?: string; disabled?: boolean };
export function RadioGroup({ name, value, onChange, options, label, disabled = false }: Props) {
  return <fieldset className="ui-radio-group" disabled={disabled}><legend>{label}</legend>{options.map(option => <label className="ui-radio" key={option.value}><input type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} /><span className="ui-radio__dot" aria-hidden="true" /><span className="ui-radio__copy"><span>{option.label}</span>{option.description ? <small>{option.description}</small> : null}</span></label>)}</fieldset>;
}
