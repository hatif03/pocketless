import { PromisesView } from "@/modules/promises/ui/views/promises-view";
import { requireUser } from "@/lib/require-user";

const Page = async () => {
  await requireUser();
  return <PromisesView />;
};

export default Page;
