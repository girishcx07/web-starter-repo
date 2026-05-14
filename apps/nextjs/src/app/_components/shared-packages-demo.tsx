import type { WebFramework } from "@acme/types";
import {
  DemoUserSchema,
  parseWebFramework,
  toUserId,
  unwrap,
} from "@acme/types";
import {
  clamp,
  describeWebFramework,
  formatRelativeTime,
  monorepoFrameworksSentence,
} from "@acme/utils";

const demoUser = DemoUserSchema.parse({
  id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  displayName: "ACME demo user",
  role: "viewer",
});
const created = new Date(Date.now() - 45_000);

export function SharedPackagesDemo(props: { framework: WebFramework }) {
  const parsed = unwrap(parseWebFramework(props.framework));
  const rejected = parseWebFramework("angular");

  return (
    <section className="bg-muted/40 w-full max-w-2xl rounded-lg border p-4 text-left text-sm">
      <h2 className="text-foreground mb-2 font-semibold">
        @acme/types + @acme/utils
      </h2>
      <p className="text-muted-foreground mb-2">
        {monorepoFrameworksSentence()}
      </p>
      <p className="mb-1">
        This app: <strong>{describeWebFramework(parsed)}</strong>{" "}
        <span className="text-muted-foreground">
          (runtime parse + unwrap: <code>{parsed}</code>)
        </span>
      </p>
      <p className="text-muted-foreground mb-1">
        Invalid parse preserved as data:{" "}
        <code>{rejected.ok ? "unexpected" : rejected.error.message}</code>
      </p>
      <p className="mb-1">
        Branded <code>UserId</code>:{" "}
        <code className="text-xs">{String(toUserId(demoUser.id))}</code>
      </p>
      <p className="mb-1">
        <code>clamp(150, 0, 100)</code> → {clamp(150, 0, 100)}
      </p>
      <p>
        <code>formatRelativeTime</code> → {formatRelativeTime(created)}
      </p>
    </section>
  );
}
