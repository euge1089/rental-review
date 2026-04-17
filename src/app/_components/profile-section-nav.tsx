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

  return (
    <nav className={className} aria-label="Profile sections">
      <div className="flex w-full min-w-0 items-stretch">
        {sections.flatMap((section, index) => {
          const active = activeId === section.id;
          const link = (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={active ? "true" : undefined}
              className={`flex min-h-10 min-w-0 flex-1 basis-0 items-center justify-center px-2 py-2 text-center text-xs font-semibold transition sm:px-3 sm:text-sm ${
                active
                  ? "text-muted-blue-hover underline decoration-2 underline-offset-[0.2em]"
                  : "text-zinc-600 hover:text-muted-blue-hover"
              }`}
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
  );
}
