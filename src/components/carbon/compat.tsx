import { createElement, useEffect, useRef, type ReactNode } from 'react';

type CarbonProps = Record<string, any> & {
  children?: ReactNode;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void;
  onChange?: (event: any) => void;
};

function CustomElement({ tag, children, ...props }: CarbonProps & { tag: string }) {
  return createElement(tag, props, children);
}

export function Tile(props: CarbonProps) {
  return createElement('cds-tile', props, props.children);
}

export function Grid({ fullWidth, ...props }: CarbonProps & { fullWidth?: boolean }) {
  return createElement('cds-grid', { ...props, 'full-width': fullWidth ? true : undefined }, props.children);
}

export function Column({ sm, md, lg, xlg, max, ...props }: CarbonProps & { sm?: number | string; md?: number | string; lg?: number | string; xlg?: number | string; max?: number | string }) {
  return createElement('cds-column', { ...props, sm, md, lg, xlg, max }, props.children);
}

export function Tag({ type = 'gray', children, ...props }: CarbonProps & { type?: string }) {
  const typeMap: Record<string, string> = { 'warm-gray': 'warm-gray', 'cool-gray': 'cool-gray', red: 'red', green: 'green', blue: 'blue', purple: 'purple', cyan: 'cyan', gray: 'gray' };
  return createElement('cds-tag', { ...props, type: typeMap[type] ?? type }, children);
}

export function InlineNotification({ kind = 'info', title, subtitle, lowContrast, hideCloseButton, onCloseButtonClick, ...props }: CarbonProps & {
  kind?: string; title?: string; subtitle?: string; lowContrast?: boolean; hideCloseButton?: boolean; onCloseButtonClick?: () => void;
}) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !onCloseButtonClick) return;
    const close = () => onCloseButtonClick();
    element.addEventListener('cds-notification-closed', close);
    return () => element.removeEventListener('cds-notification-closed', close);
  }, [onCloseButtonClick]);
  return createElement('cds-inline-notification', {
    ref, ...props, kind, title, subtitle,
    lowContrast,
    hideCloseButton,
  });
}

export function Search({ labelText, onChange, ...props }: CarbonProps & { labelText?: string; onChange?: (event: any) => void }) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !onChange) return;
    const notify = (event: Event) => {
      const target = event.target as HTMLElement & { value?: string };
      if (target.value !== undefined) onChange({ target: { value: target.value } });
    };
    element.addEventListener('input', notify);
    element.addEventListener('change', notify);
    return () => {
      element.removeEventListener('input', notify);
      element.removeEventListener('change', notify);
    };
  }, [onChange]);
  return createElement('cds-search', { ref, labelText, ...props });
}

export function Table(props: CarbonProps) {
  return createElement('cds-table', props, props.children);
}
export function TableHead(props: CarbonProps) {
  return createElement('cds-table-head', props, props.children);
}
export function TableBody(props: CarbonProps) {
  return createElement('cds-table-body', props, props.children);
}
export function TableRow(props: CarbonProps) {
  return createElement('cds-table-row', props, props.children);
}
export function TableHeader(props: CarbonProps) {
  return createElement('cds-table-header-cell', props, props.children);
}
export function TableCell(props: CarbonProps) {
  return createElement('cds-table-cell', props, props.children);
}
export function FileUploaderButton({ onChange, ...props }: CarbonProps & { onChange?: (event: any) => void }) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !onChange) return;
    const handleChange = (event: Event) => {
      const detail = (event as CustomEvent<{ addedFiles?: FileList | File[] }>).detail;
      const files = detail?.addedFiles;
      onChange({
        target: { files },
        currentTarget: { value: '' },
      });
    };
    element.addEventListener('cds-file-uploader-button-changed', handleChange);
    return () => element.removeEventListener('cds-file-uploader-button-changed', handleChange);
  }, [onChange]);
  return createElement('cds-file-uploader-button', { ref, ...props }, props.children);
}

type SideNavBaseProps = CarbonProps & {
  href?: string;
  isActive?: boolean;
  renderIcon?: (props: { size?: number }) => ReactNode;
  onClick?: (event: any) => void;
  title?: string;
};

function slottedIcon(renderIcon?: (props: { size?: number }) => ReactNode) {
  if (!renderIcon) return null;
  return createElement('span', { slot: 'title-icon', 'aria-hidden': true }, renderIcon({ size: 16 }));
}

export function SideNavItems(props: CarbonProps) {
  return createElement('cds-side-nav-items', props, props.children);
}

export function SideNavLink({ isActive, renderIcon, children, ...props }: SideNavBaseProps) {
  return createElement('cds-side-nav-link', { ...props, active: isActive }, slottedIcon(renderIcon), children);
}

export function SideNavMenu({ isActive, renderIcon, title, children, ...props }: SideNavBaseProps) {
  return createElement('cds-side-nav-menu', { ...props, active: isActive, expanded: isActive, title }, slottedIcon(renderIcon), children);
}

export function SideNavMenuItem({ isActive, children, ...props }: SideNavBaseProps) {
  return createElement('cds-side-nav-menu-item', { ...props, active: isActive }, children);
}

export function SideNav(props: CarbonProps) {
  return createElement('cds-side-nav', props, props.children);
}
