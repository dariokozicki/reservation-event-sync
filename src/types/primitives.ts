import type { ComponentProps, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';
export type ButtonProps = ComponentProps<'button'> & { variant?: ButtonVariant };
export type IconButtonProps = ComponentProps<'button'> & { label: string };
export type InputProps = ComponentProps<'input'>;
export type SelectProps = ComponentProps<'select'>;
export type LabelProps = ComponentProps<'label'>;
export type HeadingProps = ComponentProps<'h1'>;
export type SiteHeaderProps = { children?: ReactNode };
