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
    audio: z.string().url(),
    featured: z.boolean().default(false),
    externalLinks: z
      .object({
        bilibili: z.string().url().optional(),
        netease: z.string().url().optional(),
        soundcloud: z.string().url().optional()
      })
      .optional()
  })
});

export const collections = { works };
