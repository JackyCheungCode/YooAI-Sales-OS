import {
  Select as CarbonSelect,
  SelectItem,
  TextArea as CarbonTextArea,
  TextInput as CarbonTextInput,
} from '@carbon/react';
import type { ComponentProps, ReactNode } from 'react';

type Common = { label: string; hint?: string; error?: string; id: string };

export function Field({ label, hint, error, id, children }: Common & { children: ReactNode }) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>{label}</label>
      {children}
      {error ? <div className="field__error" role="alert">{error}</div> : hint ? <div className="field__hint">{hint}</div> : null}
    </div>
  );
}

type TextInputProps = Omit<ComponentProps<typeof CarbonTextInput>, 'labelText'> & { labelText?: string };
export function TextInput({ labelText, ...props }: TextInputProps) {
  const accessibleLabel = labelText ?? (typeof props['aria-label'] === 'string' ? props['aria-label'] : '输入');
  return <CarbonTextInput labelText={accessibleLabel} hideLabel={!labelText} {...props} />;
}

type SelectInputProps = Omit<ComponentProps<typeof CarbonSelect>, 'labelText'> & { labelText?: string };
export function SelectInput({ labelText, children, ...props }: SelectInputProps) {
  return (
    <CarbonSelect labelText={labelText ?? '请选择'} hideLabel={!labelText} {...props}>
      {children}
    </CarbonSelect>
  );
}

type TextAreaInputProps = Omit<ComponentProps<typeof CarbonTextArea>, 'labelText'> & { labelText?: string };
export function TextAreaInput({ labelText, ...props }: TextAreaInputProps) {
  return <CarbonTextArea labelText={labelText ?? '文本内容'} hideLabel={!labelText} {...props} />;
}

export { SelectItem };
