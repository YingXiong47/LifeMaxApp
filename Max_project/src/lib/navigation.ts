"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

type RouterLike = {
  push: AppRouterInstance["push"];
  replace: AppRouterInstance["replace"];
};

export function navigateWithFallback(
  router: RouterLike,
  href: string,
  options?: {
    replace?: boolean;
    fallbackMs?: number;
  }
) {
  const replace = options?.replace ?? false;
  const fallbackMs = options?.fallbackMs ?? 900;

  if (typeof window === "undefined") {
    if (replace) {
      router.replace(href);
    } else {
      router.push(href);
    }
    return;
  }

  const targetUrl = new URL(href, window.location.origin);
  const targetPath = targetUrl.pathname;
  let settled = false;

  const watcher = window.setInterval(() => {
    if (window.location.pathname === targetPath) {
      settled = true;
      window.clearInterval(watcher);
    }
  }, 60);

  window.setTimeout(() => {
    window.clearInterval(watcher);

    if (!settled && window.location.pathname !== targetPath) {
      if (replace) {
        window.location.replace(href);
      } else {
        window.location.assign(href);
      }
    }
  }, fallbackMs);

  if (replace) {
    router.replace(href);
  } else {
    router.push(href);
  }
}
