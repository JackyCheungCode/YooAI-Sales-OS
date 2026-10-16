import {
  Select as CarbonSelect,
  SelectItem,
  TextArea as CarbonTextArea,
  TextInput as CarbonTextInput,
} from '@carbon/react';
import { useId, type ComponentProps, type ReactNode } from 'react';

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

type TextInputProps = Omit<ComponentProps<typeof CarbonTextInput>, 'labelText' | 'id'> & { labelText?: string; id?: string };
export function TextInput({ labelText, id, ...props }: TextInputProps) {
  const generatedId = useId();
  const accessibleLabel = labelText ?? (typeof props['aria-label'] === 'string' ? props['aria-label'] : '输入');
  return <CarbonTextInput id={id ?? generatedId} labelText={accessibleLabel} hideLabel={!labelText} {...props} />;
}

type SelectInputProps = Omit<ComponentProps<typeof CarbonSelect>, 'labelText' | 'id'> & { labelText?: string; id?: string };
export function SelectInput({ labelText, id, children, ...props }: SelectInputProps) {
  const generatedId = useId();
  return (
    <CarbonSelect id={id ?? generatedId} labelText={labelText ?? '请选择'} hideLabel={!labelText} {...props}>
      {children}
    </CarbonSelect>
  );
}

type TextAreaInputProps = Omit<ComponentProps<typeof CarbonTextArea>, 'labelText' | 'id'> & { labelText?: string; id?: string };
export function TextAreaInput({ labelText, id, ...props }: TextAreaInputProps) {
  const generatedId = useId();
  return <CarbonTextArea id={id ?? generatedId} labelText={labelText ?? '文本内容'} hideLabel={!labelText} {...props} />;
}

export { SelectItem };
