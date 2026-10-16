import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
type Common={label:string;hint?:string;error?:string;id:string};
export function Field({label,hint,error,id,children}:Common & {children:ReactNode}){return <div className="field"><label className="field__label" htmlFor={id}>{label}</label>{children}{error?<div className="field__error">{error}</div>:hint?<div className="field__hint">{hint}</div>:null}</div>}
export function TextInput(props:InputHTMLAttributes<HTMLInputElement>){const {className='',...rest}=props;return <input className={`ui-input ${className}`.trim()} {...rest}/>}
export function SelectInput(props:SelectHTMLAttributes<HTMLSelectElement>){const {className='',children,...rest}=props;return <select className={`ui-input ui-select ${className}`.trim()} {...rest}>{children}</select>}
export function TextAreaInput(props:TextareaHTMLAttributes<HTMLTextAreaElement>){const {className='',...rest}=props;return <textarea className={`ui-input ui-textarea ${className}`.trim()} {...rest}/>}
