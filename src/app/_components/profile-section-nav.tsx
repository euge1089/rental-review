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
      {sections.map((section) => {
        const active = activeId === section.id;
        return (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={active ? "true" : undefined}
            className={`inline-flex min-h-10 shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              active
                ? "border-muted-blue/45 bg-muted-blue-tint text-muted-blue-hover"
                : "border-zinc-200 bg-white text-muted-blue-hover hover:border-muted-blue/35 hover:bg-muted-blue-tint/30"
            }`}
          >
            {section.label}
          </a>
        );
      })}
    </nav>
  );
}
