import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { requireUser } from "@/lib/require-user";
import { HomeView } from "@/modules/home/ui/views/home-view";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";

const Page = async () => {
  await requireUser();
  return (
    <ErrorBoundary
      fallback={
        <ErrorState title="Could not load roster" description="Try again" />
      }
    >
      <Suspense
        fallback={
          <LoadingState title="Loading" description="People and promises" />
        }
      >
        <HomeView />
      </Suspense>
    </ErrorBoundary>
  );
};

export default Page;
