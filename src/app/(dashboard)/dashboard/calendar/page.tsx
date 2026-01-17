import { FeatureGate } from "@/components/dashboard/feature-gate";
import { CalendarContent } from "./calendar-content";

export default function CalendarPage() {
  return (
    <FeatureGate feature="calendar">
      <CalendarContent />
    </FeatureGate>
  );
}
