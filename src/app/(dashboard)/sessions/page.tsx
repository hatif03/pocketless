import { SessionsView } from "@/modules/sessions/ui/views/sessions-view";
import { requireUser } from "@/lib/require-user";

const Page = async () => {
  await requireUser();
  return <SessionsView />;
};

export default Page;
