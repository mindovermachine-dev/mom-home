import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        redirectFrom: z.union([z.string(), z.array(z.string())]).optional(),
        "redirect-from": z.union([z.string(), z.array(z.string())]).optional(),
        giscus: z.boolean().optional(),
        pdf: z.boolean().optional(),
      }),
    }),
  }),
};
