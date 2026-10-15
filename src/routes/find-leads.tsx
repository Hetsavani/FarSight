import { createFileRoute } from "@tanstack/react-router";
import { RadarScreen, pageHead } from "@/components/radar/screen";
export const Route = createFileRoute("/find-leads")({
  head: () =>
    pageHead(
      "Find new opportunities",
      "Find new opportunities: review engineering opportunities, buying signals, and discovery intelligence in Opportunity Radar.",
    ),
  component: Page,
});
function Page() {
  return <RadarScreen page="find-leads" />;
}
