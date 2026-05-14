import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";

import { createQueryClient } from "./query-client";

export function ReactQueryProvider(props: { children: React.ReactNode }) {
  const [client] = useState(() => createQueryClient());
  return (
    <QueryClientProvider client={client}>{props.children}</QueryClientProvider>
  );
}
