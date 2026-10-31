"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const sync = () =>
      setDark(document.documentElement.dataset.theme === "dark");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    const onStorage = (event: StorageEvent) => {
      if (event.key === "em-theme" || event.key === null) {
        document.documentElement.dataset.theme =
          event.newValue === "dark" ? "dark" : "light";
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      observer.disconnect();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  function toggle() {
    const next =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setDark(next === "dark");
    try {
      localStorage.setItem("em-theme", next);
    } catch {
      /* Theme remains usable when storage is blocked. */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      className="theme-toggle"
    >
      Dark mode <span aria-hidden="true">{dark ? "●" : "○"}</span>
    </button>
  );
}
