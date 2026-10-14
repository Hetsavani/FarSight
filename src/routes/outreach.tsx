import { createFileRoute } from '@tanstack/react-router';
import { RadarScreen, pageHead } from '@/components/radar/screen';
export const Route = createFileRoute('/outreach')({
 head: () => pageHead('Outreach Workbench', 'Outreach Workbench: review engineering opportunities, buying signals, and discovery intelligence in Opportunity Radar.'),
 component: Page,
});
function Page() {return <RadarScreen page="outreach" />;}
