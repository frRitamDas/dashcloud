import Link from 'next/link';
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'ghost' | 'outline' | 'danger' | 'subtle';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const variantClass: Record<Variant, string> = {
  primary: 'btn-primary',
  ghost: 'btn-ghost',
  outline: 'btn-outline',
  danger: 'btn-danger',
  subtle: 'btn text-white/70 hover:text-white hover:bg-white/5 px-3 py-2',
};

const sizeClass: Record<Size, string> = {
  sm: '!px-3 !py-1.5 !text-[12.5px] !rounded-lg',
  md: '',
  lg: '!px-6 !py-3.5 !text-[15px] !rounded-2xl',
  icon: '!px-0 !py-0 !w-10 !h-10 !rounded-xl',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(variantClass[variant], sizeClass[size], className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  children,
  href,
  ...rest
}: CommonProps & { href: string } & Omit<ComponentProps<typeof Link>, 'href' | 'className' | 'children'>) {
  return (
    <Link href={href} className={cn(variantClass[variant], sizeClass[size], className)} {...rest}>
      {children}
    </Link>
  );
}
