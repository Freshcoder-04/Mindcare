// client/src/pages/counselor/SlotManagementPage.tsx
import PageLayout from "@/components/layout/page-layout";
import SlotManagement from "@/components/counselor/slot-management";

export default function SlotManagementPage() {
  return (
    <PageLayout title="Manage Available Slots" description="Set your available time slots for counseling appointments">
      <SlotManagement />
    </PageLayout>
  );
}
