import { createElement } from 'react';

type Props = {
  id?: string;
  name?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  value?: string;
  children: string;
  onChange?: (event: { target: HTMLInputElement }) => void;
  className?: string;
};

export function Checkbox({ children, ...props }: Props) {
  return createElement('cds-checkbox', { labelText: children, ...props });
}
