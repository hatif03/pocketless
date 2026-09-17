import { PersonView } from "@/modules/people/ui/views/person-view";
import { requireUser } from "@/lib/require-user";

const Page = async () => {
  await requireUser();
  return <PersonView />;
};

export default Page;
