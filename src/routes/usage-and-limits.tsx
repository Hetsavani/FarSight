import { createFileRoute } from "@tanstack/react-router";
import { RadarScreen, pageHead } from "@/components/radar/screen";
export const Route = createFileRoute("/usage-and-limits")({
  head: () =>
    pageHead(
      "Usage & Cost Guardrails",
      "Usage & Cost Guardrails: review engineering opportunities, buying signals, and discovery intelligence in Opportunity Radar.",
    ),
  component: Page,
});
function Page() {
  return <RadarScreen page="usage-and-limits" />;
}
