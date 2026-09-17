import { SessionDetailView } from "@/modules/sessions/ui/views/session-detail-view";
import { requireUser } from "@/lib/require-user";

const Page = async () => {
  await requireUser();
  return <SessionDetailView />;
};

export default Page;
