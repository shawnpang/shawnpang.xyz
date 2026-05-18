import Hero from "@/app/components/sections/Hero";
import SixtySecond from "@/app/components/sections/SixtySecond";
import Buckets from "@/app/components/sections/Buckets";
import Funnel from "@/app/components/sections/Funnel";
import Filters from "@/app/components/sections/Filters";
import Signals from "@/app/components/sections/Signals";
import ScoreSim from "@/app/components/sections/ScoreSim";
import Diversity from "@/app/components/sections/Diversity";
import Journey from "@/app/components/sections/Journey";
import FeedReRank from "@/app/components/sections/FeedReRank";
import Scorecard from "@/app/components/sections/Scorecard";
import Myths from "@/app/components/sections/Myths";
import SiteFooter from "@/app/components/sections/SiteFooter";

export default function Home() {
  return (
    <>
      <Hero />
      <SixtySecond />
      <Buckets />
      <Funnel />
      <Filters />
      <Signals />
      <ScoreSim />
      <Diversity />
      <Journey />
      <FeedReRank />
      <Scorecard />
      <Myths />
      <SiteFooter />
    </>
  );
}
