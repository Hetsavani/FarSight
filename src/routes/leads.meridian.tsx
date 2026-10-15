import { createFileRoute } from "@tanstack/react-router";
import { RadarScreen, pageHead } from "@/components/radar/screen";
export const Route = createFileRoute("/leads/meridian")({
  head: () =>
    pageHead(
      "Meridian Hospitality Collective",
      "Meridian Hospitality Collective: review engineering opportunities, buying signals, and discovery intelligence in Opportunity Radar.",
    ),
  component: Page,
});
function Page() {
  return <RadarScreen page="lead-inbox" detail />;
}
