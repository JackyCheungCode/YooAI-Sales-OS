import { createElement } from 'react';

type Option = { value: string; label: string; description?: string };
type Props = { name: string; value: string; onChange: (value: string) => void; options: Option[]; label?: string; disabled?: boolean };

export function RadioGroup({ name, value, onChange, options, label = '选项', disabled = false }: Props) {
  return createElement(
    'cds-radio-button-group',
    {
      name,
      legendText: label,
      value,
      orientation: 'horizontal',
      disabled,
      onChange: (event: Event) => {
        const target = event.target as HTMLElement & { value?: string };
        if (target.value) onChange(target.value);
      },
    },
    ...options.map((option) => createElement('cds-radio-button', {
      key: option.value,
      id: name + '-' + option.value,
      value: option.value,
      labelText: option.description ? option.label + ' — ' + option.description : option.label,
      disabled,
      selected: value === option.value,
    })),
  );
}
