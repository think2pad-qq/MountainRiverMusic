import { defineCollection, z } from 'astro:content';

const works = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    year: z.number(),
    style: z.array(z.string()),
    duration: z.string().default(''),
    cover: z.string().default(''),
    audio: z.string().default(''),
    type: z.string().default('single'),
    tracks: z.array(z.object({
      title: z.string(),
      audio: z.string().optional(),
      duration: z.string().optional(),
      cover: z.string().optional(),
    })).optional(),
    showOnHome: z.boolean().default(false),
    useAsHeroCover: z.boolean().default(false),
    useAsHeroPlayer: z.boolean().default(false),
    externalLinks: z
      .object({
        netease: z.string().url().optional()
      })
      .optional()
  })
});

export const collections = { works };
