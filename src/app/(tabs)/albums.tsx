import { EmptyState } from "@/components/empty-state";
import { strings } from "@/lib/strings";

export default function AlbumsScreen() {
  return <EmptyState title={strings.emptyStates.nothingYet} />;
}
