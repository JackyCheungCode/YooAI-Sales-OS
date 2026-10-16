import type { ButtonHTMLAttributes, ReactNode } from 'react';
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary'|'secondary'|'ghost'|'danger'; size?: 'sm'|'md'; children: ReactNode };
export function Button({variant='primary',size='md',className='',children,...props}:Props){return <button className={`ui-button ui-button--${variant} ui-button--${size} ${className}`.trim()} {...props}>{children}</button>}
