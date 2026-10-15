import { createFileRoute } from "@tanstack/react-router";
import { RadarScreen, pageHead } from "@/components/radar/screen";
export const Route = createFileRoute("/lead-inbox")({
  head: () =>
    pageHead(
      "Lead Inbox",
      "Lead Inbox: review engineering opportunities, buying signals, and discovery intelligence in Opportunity Radar.",
    ),
  component: Page,
});
function Page() {
  return <RadarScreen page="lead-inbox" />;
}
