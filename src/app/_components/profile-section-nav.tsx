"use client";

import { useEffect, useMemo, useState } from "react";

type SectionItem = {
  id: string;
  label: string;
};

type Props = {
  sections: SectionItem[];
  className?: string;
};

export function ProfileSectionNav({
  sections,
  className,
}: Props) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const sectionIds = useMemo(() => sections.map((section) => section.id), [sections]);

  useEffect(() => {
    if (sectionIds.length === 0) return;
    const visibleScores = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).id;
          if (!id) continue;
          if (entry.isIntersecting) {
            visibleScores.set(id, entry.intersectionRatio);
          } else {
            visibleScores.delete(id);
          }
        }

        const sortedVisible = [...visibleScores.entries()].sort((a, b) => b[1] - a[1]);
        if (sortedVisible[0]?.[0]) {
          setActiveId(sortedVisible[0][0]);
        }
      },
      {
        root: null,
        rootMargin: "-35% 0px -50% 0px",
        threshold: [0.1, 0.25, 0.5, 0.75],
      },
    );

    for (const id of sectionIds) {
      const node = document.getElementById(id);
      if (node) observer.observe(node);
    }

    return () => observer.disconnect();
  }, [sectionIds]);

  useEffect(() => {
    if (!privacyOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPrivacyOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [privacyOpen]);

  return (
    <>
      <nav className={className} aria-label="Profile sections">
        <div className="flex w-full min-w-0 items-stretch">
          {sections.flatMap((section, index) => {
            const active = activeId === section.id;
            const baseClass = `flex min-w-0 flex-1 basis-0 items-center justify-center px-2 py-2 text-center text-xs font-semibold transition max-sm:min-h-11 max-sm:py-2.5 max-sm:text-[13px] sm:px-3 sm:text-sm ${
              active
                ? "text-muted-blue-hover underline decoration-2 underline-offset-[0.2em]"
                : "text-zinc-600 hover:text-muted-blue-hover"
            }`;

            const link =
              section.id === "profile-privacy" ? (
                <button
                  key={section.id}
                  type="button"
                  className={baseClass}
                  onClick={() => {
                    setActiveId(section.id);
                    setPrivacyOpen(true);
                  }}
                >
                  {section.label}
                </button>
              ) : (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  aria-current={active ? "true" : undefined}
                  className={baseClass}
                >
                  {section.label}
                </a>
              );

            if (index === 0) return [link];
            return [
              <span
                key={`sep-${section.id}`}
                className="flex shrink-0 select-none items-center px-1.5 text-zinc-300 sm:px-2"
                aria-hidden
              >
                |
              </span>,
              link,
            ];
          })}
        </div>
      </nav>

      {privacyOpen ? (
        <div className="fixed inset-0 z-[80] bg-zinc-900/45 p-4 pt-[max(1rem,env(safe-area-inset-top,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))] backdrop-blur-[2px] sm:p-6">
          <div className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_24px_60px_-18px_rgb(15_23_42/0.45)] sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 sm:px-6">
              <p className="text-sm font-semibold tracking-tight text-muted-blue-hover sm:text-base">
                Privacy
              </p>
              <button
                type="button"
                onClick={() => setPrivacyOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-800"
                aria-label="Close privacy"
              >
                ×
              </button>
            </div>
            <iframe
              src="/legal/privacy"
              title="Privacy policy"
              className="h-full w-full flex-1 border-0"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
