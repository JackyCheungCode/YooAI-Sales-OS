import type { InputHTMLAttributes, ReactNode } from 'react';
type Props=Omit<InputHTMLAttributes<HTMLInputElement>,'type'> & {children:ReactNode};
export function Checkbox({children,className='',...props}:Props){return <label className={`ui-check ${className}`.trim()}><input type="checkbox" {...props}/><span className="ui-check__box" aria-hidden="true"/><span>{children}</span></label>}
