"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  className?: string;
  children: React.ReactNode;
};

export function HowItWorksNavLink({ className, children }: Props) {
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "";

  if (isHome) {
    return (
      <a href="#how-it-works" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href="/#how-it-works" className={className}>
      {children}
    </Link>
  );
}
