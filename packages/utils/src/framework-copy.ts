import { WEB_FRAMEWORKS, type WebFramework } from "@acme/types";

import { assertNever } from "./assert-never";
import { formatList } from "./format";

/** User-facing label for each supported web stack. */
export function describeWebFramework(framework: WebFramework): string {
  switch (framework) {
    case "nextjs":
      return "Next.js (App Router)";
    case "tanstack-start":
      return "TanStack Start";
    case "react-router":
      return "React Router v7";
    default:
      return assertNever(framework);
  }
}

/** Demo blurb listing all frameworks (uses `@acme/types` + list formatting). */
export function monorepoFrameworksSentence(): string {
  const labels = WEB_FRAMEWORKS.map(describeWebFramework);
  return `Shared packages power ${formatList(labels, "and")}.`;
}
