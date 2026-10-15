import { createFileRoute } from "@tanstack/react-router";
import { RadarScreen, pageHead } from "@/components/radar/screen";
export const Route = createFileRoute("/sources-and-platforms")({
  head: () =>
    pageHead(
      "Sources & Platforms",
      "Sources & Platforms: review engineering opportunities, buying signals, and discovery intelligence in Opportunity Radar.",
    ),
  component: Page,
});
function Page() {
  return <RadarScreen page="sources-and-platforms" />;
}
