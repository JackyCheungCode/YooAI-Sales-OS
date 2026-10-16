import { createElement, useEffect, useId, useRef, type ReactNode } from 'react';

type ValueEvent = { target: { value: string } };
type CommonControlProps = {
  id?: string;
  labelText?: string;
  value?: string | number;
  defaultValue?: string | number;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  name?: string;
  className?: string;
  onChange?: (event: ValueEvent) => void;
  [key: string]: unknown;
};

function useCarbonChange(
  ref: { current: HTMLElement | null },
  onChange: CommonControlProps['onChange'],
) {
  useEffect(() => {
    const element = ref.current;
    if (!element || !onChange) return;
    const notify = (event: Event) => {
      const target = event.target as HTMLElement & { value?: string };
      const detail = (event as CustomEvent<{ value?: string }>).detail;
      const value = target?.value ?? detail?.value;
      if (value !== undefined) onChange({ target: { value: String(value) } });
    };
    const eventNames = ['input', 'change', 'cds-select-selected', 'cds-text-input-input', 'cds-text-area-input'];
    eventNames.forEach((name) => element.addEventListener(name, notify));
    return () => eventNames.forEach((name) => element.removeEventListener(name, notify));
  }, [ref, onChange]);
}

type Common = { label: string; hint?: string; error?: string; id: string };

export function Field({ label, hint, error, id, children }: Common & { children: ReactNode }) {
  return createElement('div', { className: 'field' },
    createElement('label', { className: 'field__label', htmlFor: id }, label),
    children,
    error ? createElement('div', { className: 'field__error', role: 'alert' }, error)
      : hint ? createElement('div', { className: 'field__hint' }, hint) : null,
  );
}

export function TextInput({ labelText, id, onChange, ...props }: CommonControlProps) {
  const generatedId = useId();
  const ref = useRef<HTMLElement | null>(null);
  useCarbonChange(ref, onChange);
  const label = labelText ?? (typeof props['aria-label'] === 'string' ? props['aria-label'] : '输入');
  return createElement('cds-text-input', {
    ref,
    id: id ?? generatedId,
    label,
    labelText: label,
    hideLabel: !labelText,
    ...props,
  });
}

export function SelectInput({ labelText, id, onChange, children, ...props }: CommonControlProps & { children?: ReactNode }) {
  const generatedId = useId();
  const ref = useRef<HTMLElement | null>(null);
  useCarbonChange(ref, onChange);
  return createElement('cds-select', {
    ref,
    id: id ?? generatedId,
    labelText: labelText ?? '请选择',
    hideLabel: !labelText,
    ...props,
  }, children);
}

export function SelectItem({ value, text, children }: { value: string; text?: string; children?: ReactNode }) {
  return createElement('cds-select-item', { value, text }, children ?? text);
}

export function TextAreaInput({ labelText, id, onChange, ...props }: CommonControlProps) {
  const generatedId = useId();
  const ref = useRef<HTMLElement | null>(null);
  useCarbonChange(ref, onChange);
  const label = labelText ?? '文本内容';
  return createElement('cds-text-area', {
    ref,
    id: id ?? generatedId,
    label,
    labelText: label,
    hideLabel: !labelText,
    ...props,
  });
}

export { SelectInput as Select, SelectItem as CarbonSelectItem, TextAreaInput as TextArea };
