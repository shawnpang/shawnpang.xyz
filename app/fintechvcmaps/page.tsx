import FintechVcMap from "./_components/FintechVcMap";
import investorsData from "./_data/dataset.json";
import peopleData from "./_data/people.json";
import summaryData from "./_data/summary.json";
import type { Investor, Person, Summary } from "./_lib/types";

export default function FintechVcMapsPage() {
  return (
    <FintechVcMap
      investors={investorsData as Investor[]}
      people={peopleData as Person[]}
      summary={summaryData as Summary}
    />
  );
}
