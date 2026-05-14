import { z } from "zod/v4";

export const unused = z.string().describe(
  `This package is available for shared validation schemas.
   As the app grows, put validators that need to be shared across apps here
  `,
);
