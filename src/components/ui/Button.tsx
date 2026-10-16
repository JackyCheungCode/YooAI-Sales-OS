import { Button as CarbonButton } from '@carbon/react';
import type { ComponentProps, ReactNode } from 'react';

type CarbonButtonProps = ComponentProps<typeof CarbonButton>;
type Props = Omit<CarbonButtonProps, 'kind' | 'size' | 'children'> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  children: ReactNode;
};

const kindByVariant = {
  primary: 'primary',
  secondary: 'secondary',
  ghost: 'ghost',
  danger: 'danger',
} as const;

export function Button({ variant = 'primary', size = 'md', children, ...props }: Props) {
  return (
    <CarbonButton kind={kindByVariant[variant]} size={size} {...props}>
      {children}
    </CarbonButton>
  );
}
