import { BrowsePageShell } from "../components/browse/BrowsePageShell";
import { PublicJobListSection } from "../components/browse/PublicJobListSection";

export function JobListPage() {
  return (
    <BrowsePageShell>
      <PublicJobListSection headingLevel="page" title="Vagas disponíveis" />
    </BrowsePageShell>
  );
}
