import { createElement, type ComponentType, type KeyboardEventHandler, type MouseEventHandler, type ReactNode } from 'react';

type Props = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  children: ReactNode;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
  renderIcon?: ComponentType<{ size?: number }>;
  [key: string]: unknown;
};

function resolveKind(variant: Props['variant'], className?: string) {
  if (variant) return variant;
  const classes = className ?? '';
  if (/\b(danger|destructive|delete|remove)\b/i.test(classes)) return 'danger';
  if (/\bprimary\b/i.test(classes)) return 'primary';
  if (/\bsecondary\b/i.test(classes)) return 'secondary';
  return 'ghost';
}

export function Button({
  variant,
  size = 'md',
  children,
  className,
  renderIcon: Icon,
  ...props
}: Props) {
  return createElement(
    'cds-button',
    { kind: resolveKind(variant, className), size: size === 'sm' ? 'sm' : 'md', className, ...props },
    Icon ? createElement(Icon, { size: 16, slot: 'icon' } as never) : null,
    children,
  );
}
