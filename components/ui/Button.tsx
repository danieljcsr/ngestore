import Link, { type LinkProps as NextLinkProps } from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-brand text-white shadow-lg shadow-brand-indigo/25 hover:brightness-110 active:brightness-95",
  secondary: "bg-surface-2 text-foreground border border-border hover:bg-white/5",
  ghost: "bg-transparent text-foreground hover:bg-white/5",
  danger: "bg-danger/90 text-white hover:bg-danger",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5 rounded-lg gap-1.5",
  md: "text-sm px-4 py-2.5 rounded-xl gap-2",
  lg: "text-base px-6 py-3.5 rounded-xl gap-2",
};

const baseClasses =
  "inline-flex items-center justify-center font-semibold transition disabled:opacity-50 disabled:pointer-events-none cursor-pointer disabled:cursor-not-allowed";

type StyleProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

type ButtonAsButton = StyleProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = StyleProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> &
  Pick<NextLinkProps, "href" | "prefetch">;

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = "primary", size = "md", className, children } = props;
  const classes = cn(baseClasses, variantClasses[variant], sizeClasses[size], className);

  if (props.href !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructured only to exclude from `rest`
    const { href, prefetch, variant: _variant, size: _size, className: _cls, children: _kids, ...rest } = props;
    return (
      <Link href={href} prefetch={prefetch} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructured only to exclude from `rest`
  const { variant: _variant, size: _size, className: _cls, children: _kids, href: _href, ...rest } = props;
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
