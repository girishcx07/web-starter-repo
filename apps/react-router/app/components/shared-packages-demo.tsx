import {
  DemoUserSchema,
  parseWebFramework,
  toUserId,
  unwrap,
  type WebFramework,
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

export function SharedPackagesDemo(props: { framework: WebFramework }) {
  const parsed = unwrap(parseWebFramework(props.framework));
  const rejected = parseWebFramework("angular");
  const created = new Date(Date.now() - 45_000);

  return (
    <section className="mb-8 w-full max-w-2xl rounded-lg border border-gray-200 bg-gray-50 p-4 text-left text-sm dark:border-gray-700 dark:bg-gray-900/40">
      <h2 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
        @acme/types + @acme/utils
      </h2>
      <p className="mb-2 text-gray-600 dark:text-gray-400">
        {monorepoFrameworksSentence()}
      </p>
      <p className="mb-1 text-gray-800 dark:text-gray-200">
        This app:{" "}
        <strong>{describeWebFramework(parsed)}</strong>{" "}
        <span className="text-gray-600 dark:text-gray-400">
          (runtime parse + unwrap: <code>{parsed}</code>)
        </span>
      </p>
      <p className="mb-1 text-gray-600 dark:text-gray-400">
        Invalid parse preserved as data:{" "}
        <code>{rejected.ok ? "unexpected" : rejected.error.message}</code>
      </p>
      <p className="mb-1 text-gray-800 dark:text-gray-200">
        Branded <code>UserId</code>:{" "}
        <code className="text-xs">{String(toUserId(demoUser.id))}</code>
      </p>
      <p className="mb-1 text-gray-800 dark:text-gray-200">
        <code>clamp(150, 0, 100)</code> → {clamp(150, 0, 100)}
      </p>
      <p className="text-gray-800 dark:text-gray-200">
        <code>formatRelativeTime</code> → {formatRelativeTime(created)}
      </p>
    </section>
  );
}
