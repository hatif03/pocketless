import { SettingsView } from "@/modules/settings/ui/views/settings-view";
import { requireUser } from "@/lib/require-user";

const Page = async () => {
  await requireUser();
  return <SettingsView />;
};

export default Page;
