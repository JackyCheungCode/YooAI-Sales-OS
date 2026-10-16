import { Checkbox as CarbonCheckbox } from '@carbon/react';
import type { ComponentProps } from 'react';
type Props = Omit<ComponentProps<typeof CarbonCheckbox>, 'labelText'> & { children: string };
export function Checkbox({ children, ...props }: Props) {
  return <CarbonCheckbox labelText={children} {...props} />;
}
