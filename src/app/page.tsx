import { HomeHashScroll } from "@/app/_components/home-hash-scroll";
import { HomePageSections } from "@/app/_components/home-page-sections";
import { getHomePageData } from "@/lib/home-page-data";

/** Avoid Prisma at build time when DATABASE_URL is missing (e.g. first Vercel deploy). */
export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getHomePageData();
  return (
    <>
      <HomeHashScroll />
      <HomePageSections layout="fullwidth" {...data} />
    </>
  );
}
