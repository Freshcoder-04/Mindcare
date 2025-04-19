// client/src/pages/counselor/CounselorCalendarPage.tsx
import PageLayout from "@/components/layout/page-layout";
import CounselorCalendar from "@/components/counselor/counselor-calendar";

export default function CounselorCalendarPage() {
  return (
    <PageLayout 
      title="My Calendar" 
      description="View and manage your available counseling slots"
    >
      <CounselorCalendar />
    </PageLayout>
  );
}
