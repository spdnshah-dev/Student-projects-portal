import Link from "next/link";
import { type ComponentProps, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "dark";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const sizes = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-[38px] px-5 text-sm",
  lg: "h-11 px-6 text-sm",
} as const;

const variants: Record<Variant, string> = {
  primary: "bg-brand-accent text-white hover:bg-brand-accent-hover",
  secondary:
    "border border-line-input bg-white text-brand-ink hover:bg-surface-canvas",
  ghost: "text-brand-ink hover:bg-surface-sunken",
  dark: "bg-brand-ink text-white hover:bg-brand-ink/90",
};

type CommonProps = {
  variant?: Variant;
  size?: keyof typeof sizes;
  children: ReactNode;
  className?: string;
};

function classes({
  variant = "primary",
  size = "md",
  className = "",
}: CommonProps) {
  return `${base} ${sizes[size]} ${variants[variant]} ${className}`.trim();
}

export function Button({
  variant,
  size,
  className,
  children,
  ...props
}: CommonProps & Omit<ComponentProps<"button">, "className" | "children">) {
  return (
    <button className={classes({ variant, size, className, children })} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  className,
  children,
  ...props
}: CommonProps & Omit<ComponentProps<typeof Link>, "className" | "children">) {
  return (
    <Link
      className={`${classes({ variant, size, className, children })} no-underline`}
      {...props}
    >
      {children}
    </Link>
  );
}
