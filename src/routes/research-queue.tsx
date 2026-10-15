import { createFileRoute } from "@tanstack/react-router";
import { RadarScreen, pageHead } from "@/components/radar/screen";
export const Route = createFileRoute("/research-queue")({
  head: () =>
    pageHead(
      "Research Queue",
      "Research Queue: review engineering opportunities, buying signals, and discovery intelligence in Opportunity Radar.",
    ),
  component: Page,
});
function Page() {
  return <RadarScreen page="research-queue" />;
}
