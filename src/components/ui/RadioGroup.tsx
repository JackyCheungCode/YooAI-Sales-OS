import { RadioButton, RadioButtonGroup } from '@carbon/react';
type Option = { value: string; label: string; description?: string };
type Props = { name: string; value: string; onChange: (value: string) => void; options: Option[]; label?: string; disabled?: boolean };
export function RadioGroup({ name, value, onChange, options, label = '选项', disabled = false }: Props) {
  return <RadioButtonGroup name={name} legendText={label} valueSelected={value} onChange={(selected) => onChange(String(selected))} orientation="horizontal" disabled={disabled}>
    {options.map((option) => <RadioButton key={option.value} id={name + '-' + option.value} value={option.value} labelText={option.description ? option.label + ' — ' + option.description : option.label} disabled={disabled} />)}
  </RadioButtonGroup>;
}
