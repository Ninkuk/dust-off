import { EmptyState } from "@/components/empty-state";
import { strings } from "@/lib/strings";

/**
 * Failure counterpart to EmptyState. Composed rather than duplicated so both
 * share the same centred layout, type scale, and action treatment.
 *
 * Every asset/album read can fail in the real world — iCloud offline, a
 * library mid-migration, permission revoked while backgrounded — and the query
 * client does not retry on its own, so a failed read needs a user-driven way
 * back rather than an empty screen.
 */
export function ErrorState({
  title = strings.errorStates.photosTitle,
  subtitle = strings.errorStates.photosBody,
  onRetry,
}: {
  title?: string;
  subtitle?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      title={title}
      subtitle={subtitle}
      action={
        onRetry
          ? { label: strings.errorStates.retry, onPress: onRetry }
          : undefined
      }
    />
  );
}
