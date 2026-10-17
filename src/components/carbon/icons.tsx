import { createElement, type ComponentType } from 'react';
import * as CarbonIcons from '@carbon/icons-react';

type IconProps = { size?: number; [key: string]: unknown };
type CarbonReactIcon = ComponentType<any>;

function asCarbonIcon(icon: CarbonReactIcon) {
  return function CarbonWebIcon({ size = 16, ...props }: IconProps) {
    const hostSize = size <= 16 ? 16 : size <= 20 ? 20 : size <= 24 ? 24 : 32;
    return createElement('cds-icon', { size: hostSize }, createElement(icon, { ...props, size }));
  };
}

export const Add = asCarbonIcon(CarbonIcons.Add as CarbonReactIcon);
export const Api = asCarbonIcon(CarbonIcons.Api as CarbonReactIcon);
export const ArrowRight = asCarbonIcon(CarbonIcons.ArrowRight as CarbonReactIcon);
export const Building = asCarbonIcon(CarbonIcons.Building as CarbonReactIcon);
export const Calendar = asCarbonIcon(CarbonIcons.Calendar as CarbonReactIcon);
export const ChartLine = asCarbonIcon(CarbonIcons.ChartLine as CarbonReactIcon);
export const Chat = asCarbonIcon(CarbonIcons.Chat as CarbonReactIcon);
export const Checkmark = asCarbonIcon(CarbonIcons.Checkmark as CarbonReactIcon);
export const CheckmarkFilled = asCarbonIcon(CarbonIcons.CheckmarkFilled as CarbonReactIcon);
export const Close = asCarbonIcon(CarbonIcons.Close as CarbonReactIcon);
export const Copy = asCarbonIcon(CarbonIcons.Copy as CarbonReactIcon);
export const Currency = asCarbonIcon(CarbonIcons.Currency as CarbonReactIcon);
export const Dashboard = asCarbonIcon(CarbonIcons.Dashboard as CarbonReactIcon);
export const Document = asCarbonIcon(CarbonIcons.Document as CarbonReactIcon);
export const Download = asCarbonIcon(CarbonIcons.Download as CarbonReactIcon);
export const Edit = asCarbonIcon(CarbonIcons.Edit as CarbonReactIcon);
export const Email = asCarbonIcon(CarbonIcons.Email as CarbonReactIcon);
export const Filter = asCarbonIcon(CarbonIcons.Filter as CarbonReactIcon);
export const Headset = asCarbonIcon(CarbonIcons.Headset as CarbonReactIcon);
export const Launch = asCarbonIcon(CarbonIcons.Launch as CarbonReactIcon);
export const Link = asCarbonIcon(CarbonIcons.Link as CarbonReactIcon);
export const Money = asCarbonIcon(CarbonIcons.Money as CarbonReactIcon);
export const Phone = asCarbonIcon(CarbonIcons.Phone as CarbonReactIcon);
export const Renew = asCarbonIcon(CarbonIcons.Renew as CarbonReactIcon);
export const Send = asCarbonIcon(CarbonIcons.Send as CarbonReactIcon);
export const ShoppingCart = asCarbonIcon(CarbonIcons.ShoppingCart as CarbonReactIcon);
export const Task = asCarbonIcon(CarbonIcons.Task as CarbonReactIcon);
export const Time = asCarbonIcon(CarbonIcons.Time as CarbonReactIcon);
export const TrashCan = asCarbonIcon(CarbonIcons.TrashCan as CarbonReactIcon);
export const Trophy = asCarbonIcon(CarbonIcons.Trophy as CarbonReactIcon);
export const UserMultiple = asCarbonIcon(CarbonIcons.UserMultiple as CarbonReactIcon);
export const WarningAlt = asCarbonIcon(CarbonIcons.WarningAlt as CarbonReactIcon);
export const WarningFilled = asCarbonIcon(CarbonIcons.WarningFilled as CarbonReactIcon);
