import { defineCollection, z } from 'astro:content';

const works = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    year: z.number(),
    style: z.array(z.string()),
    duration: z.string(),
    cover: z.string(),
    audio: z.string(),
    featured: z.boolean().default(false),
    externalLinks: z
      .object({
        netease: z.string().url().optional()
      })
      .optional()
  })
});

export const collections = { works };
