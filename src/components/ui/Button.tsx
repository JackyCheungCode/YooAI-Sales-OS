import { createElement, type ComponentType, type MouseEventHandler, type ReactNode } from 'react';

type Props = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  children: ReactNode;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  renderIcon?: ComponentType<{ size?: number }>;
  [key: string]: unknown;
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  renderIcon: Icon,
  ...props
}: Props) {
  return createElement(
    'cds-button',
    { kind: variant, size: size === 'sm' ? 'sm' : 'md', ...props },
    Icon ? createElement(Icon, { size: 16, slot: 'icon' } as never) : null,
    children,
  );
}
