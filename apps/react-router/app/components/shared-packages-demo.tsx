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
  const rejectedLabel = rejected.ok
    ? "unexpected"
    : "invalid framework rejected";

  return (
    <section className="bg-card/80 w-full rounded-md border border-white/10 p-5 text-left text-sm shadow-xl shadow-black/20">
      <p className="text-accent text-xs font-semibold uppercase">
        Shared packages
      </p>
      <h2 className="text-foreground mt-1 text-xl font-semibold">
        Typed utilities travel with every app
      </h2>
      <p className="text-muted-foreground mt-2 leading-6">
        {monorepoFrameworksSentence()}
      </p>
      <div className="mt-4 grid gap-2">
        <div className="bg-background/40 rounded-md border border-white/10 p-3">
          <p className="text-foreground font-medium">
            {describeWebFramework(parsed)}
          </p>
          <p className="text-muted-foreground">
            Runtime parse + unwrap: <code>{parsed}</code>
          </p>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <p className="bg-background/40 text-muted-foreground rounded-md border border-white/10 p-3">
            Invalid parse: <code>{rejectedLabel}</code>
          </p>
          <p className="bg-background/40 text-muted-foreground rounded-md border border-white/10 p-3">
            Clamp result: <code>{clamp(150, 0, 100)}</code>
          </p>
        </div>
        <p className="bg-background/40 text-muted-foreground rounded-md border border-white/10 p-3">
          Branded <code>UserId</code>:{" "}
          <code className="text-xs break-all">
            {String(toUserId(demoUser.id))}
          </code>
        </p>
        <p className="bg-background/40 text-muted-foreground rounded-md border border-white/10 p-3">
          Relative time: <code>{formatRelativeTime(created)}</code>
        </p>
      </div>
    </section>
  );
}
