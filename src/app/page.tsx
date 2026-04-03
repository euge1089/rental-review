import { HomeHashScroll } from "@/app/_components/home-hash-scroll";
import { HomePageSections } from "@/app/_components/home-page-sections";
import { authOptions } from "@/lib/auth";
import { getHomePageData } from "@/lib/home-page-data";
import { getServerSession } from "next-auth";

/** Avoid Prisma at build time when DATABASE_URL is missing (e.g. first Vercel deploy). */
export const dynamic = "force-dynamic";

export default async function Home() {
  const [session, data] = await Promise.all([
    getServerSession(authOptions),
    getHomePageData(),
  ]);
  const showHeroSignUp = !session?.user?.email;

  return (
    <>
      <HomeHashScroll />
      <HomePageSections
        layout="fullwidth"
        showHeroSignUp={showHeroSignUp}
        {...data}
      />
    </>
  );
}
