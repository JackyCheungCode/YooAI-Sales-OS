import { createElement, useEffect, useRef } from 'react';

type Props = {
  id?: string;
  name?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  value?: string;
  children?: string;
  labelText?: string;
  onChange?: (event: { target: { checked: boolean } }) => void;
  className?: string;
};

export function Checkbox({ children, labelText, onChange, ...props }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !onChange) return;
    const handleChange = (event: Event) => {
      const detail = (event as CustomEvent<{ checked?: boolean }>).detail;
      const target = event.target as HTMLElement & { checked?: boolean };
      onChange({ target: { checked: detail?.checked ?? Boolean(target.checked) } });
    };
    element.addEventListener('cds-checkbox-changed', handleChange);
    return () => element.removeEventListener('cds-checkbox-changed', handleChange);
  }, [onChange]);

  return createElement('cds-checkbox', {
    ref,
    labelText: labelText ?? children ?? '',
    ...props,
  });
}
