import type { ReactNode } from "react";
import {
  appContentMaxWidthClass,
  appContentPaddingXClass,
  surfaceElevatedClass,
  surfaceSubtleClass,
} from "@/lib/ui-classes";

/** Inner column cap inside the home-aligned full-width shell (main is always 88rem max). */
const INNER_MAX: Record<AppPageWidth, string | null> = {
  wide: null,
  xwide: null,
  medium: "max-w-3xl",
  narrow: "max-w-xl",
};

export type AppPageWidth = "wide" | "narrow" | "medium" | "xwide";

export function AppPageShell({
  children,
  width = "wide",
  className,
  gapClass = "gap-8",
}: {
  children: ReactNode;
  width?: AppPageWidth;
  className?: string;
  gapClass?: string;
}) {
  const inner = INNER_MAX[width];
  const body = (
    <>
      {inner ? (
        <div className={`mx-auto w-full ${inner}`}>{children}</div>
      ) : (
        children
      )}
    </>
  );

  return (
    <main
      className={`mx-auto flex w-full min-w-0 flex-1 flex-col ${appContentMaxWidthClass} ${appContentPaddingXClass} py-8 sm:py-10 md:py-12 ${gapClass} ${className ?? ""}`}
    >
      {body}
    </main>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  descriptionClassName,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  /** Override default description typography (still use max-w-* here if needed). */
  descriptionClassName?: string;
  children?: ReactNode;
  className?: string;
}) {
  const descClass =
    descriptionClassName ??
    "max-w-2xl text-sm leading-relaxed text-zinc-600";
  return (
    <header className={`space-y-3 sm:space-y-4 ${className ?? ""}`}>
      {eyebrow ? (
        <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-pop-hover">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="break-words text-pretty text-[1.65rem] font-semibold leading-tight tracking-tight text-muted-blue-hover sm:text-3xl md:text-4xl">
        {title}
      </h1>
      {description ? (
        <div className={descClass}>{description}</div>
      ) : null}
      {children}
    </header>
  );
}

type SurfaceTag = "section" | "div" | "article" | "form";

export function SurfacePanel({
  children,
  variant = "elevated",
  className,
  as = "section",
  id,
}: {
  children: ReactNode;
  variant?: "elevated" | "subtle" | "muted";
  className?: string;
  as?: SurfaceTag;
  id?: string;
}) {
  const Tag = as;
  const surface =
    variant === "elevated"
      ? `${surfaceElevatedClass} p-4 sm:p-6 md:p-8`
      : variant === "subtle"
        ? `${surfaceSubtleClass} p-4 sm:p-5 md:p-6`
        : "rounded-2xl border border-muted-blue/25 bg-[#e4e9ef]/60 p-4 sm:p-5 md:p-6";
  return (
    <Tag id={id} className={`${surface} ${className ?? ""}`}>
      {children}
    </Tag>
  );
}
