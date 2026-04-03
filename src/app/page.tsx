import { HomeHashScroll } from "@/app/_components/home-hash-scroll";
import { HomePageSections } from "@/app/_components/home-page-sections";
import { getHomePageData } from "@/lib/home-page-data";

export default async function Home() {
  const data = await getHomePageData();
  return (
    <>
      <HomeHashScroll />
      <HomePageSections layout="fullwidth" {...data} />
    </>
  );
}
