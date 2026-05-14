import type { Route } from "./+types/home";
import { SharedPackagesDemo } from "../components/shared-packages-demo";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return { message: context.VALUE_FROM_EXPRESS };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex flex-col items-center">
      <SharedPackagesDemo framework="react-router" />
      <Welcome message={loaderData.message} />
    </div>
  );
}
