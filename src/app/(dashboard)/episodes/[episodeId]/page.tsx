import { EpisodeView } from "@/modules/people/ui/views/episode-view";
import { requireUser } from "@/lib/require-user";

const Page = async () => {
  await requireUser();
  return <EpisodeView />;
};

export default Page;
