"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNavigation } from "@/lib/content/site";

export function MarketingHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="site-header">
      <Link className="brand" href="/">
        <span className="brand-mark">LM</span>
        <span>
          <strong>LifeMax OS</strong>
          <small>Personal operating system</small>
        </span>
      </Link>

      <nav className="site-nav" aria-label="Primary">
        {primaryNavigation.map((item) => (
          <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>

      {!isHome ? (
        <div className="header-actions">
          {pathname !== "/sign-in" ? (
            <Link className="button-link" href="/sign-in">
              Sign in
            </Link>
          ) : null}
          {pathname !== "/sign-up" ? (
            <Link className="button-link primary" href="/sign-up">
              Sign up
            </Link>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
