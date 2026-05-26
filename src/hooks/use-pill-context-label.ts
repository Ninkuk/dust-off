import { strings } from "@/lib/strings";

export type PillScope =
  | { kind: "all" }
  | { kind: "album"; title: string };

export function usePillContextLabel(scope: PillScope): string {
  return scope.kind === "all"
    ? strings.pill.shuffleAll
    : strings.pill.shuffleAlbum(scope.title);
}
