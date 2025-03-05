import { Hono } from "hono";
import { Redis } from '@upstash/redis'

import { env } from "hono/adapter";
import { cors } from "hono/cors";
import { handle } from "hono/vercel";

export const runtime = "edge";
const app = new Hono().basePath("/api");

type EnvConfig = {
  UPSTASH_REDIS_REST_TOKEN: string;
  UPSTASH_REDIS_REST_URL: string;
};

app.use("/*", cors());

app.get("/search", async (c) => {
  try {
    const { UPSTASH_REDIS_REST_TOKEN, UPSTASH_REDIS_REST_URL } = env<EnvConfig>(c);
    const redis = new Redis({
      token: UPSTASH_REDIS_REST_TOKEN,
      url: UPSTASH_REDIS_REST_URL,
    });

    const query = c.req.query("q")?.toUpperCase();
    console.log("Query:", query);
    if (!query) {
      return c.json({ message: "Invalid search query" }, { status: 400 });
    }

    const results = [];
    const rank = await redis.zrank("autocomplete", query);

    if (rank !== null && rank !== undefined) {
      const suggestions = await redis.zrange<string[]>("autocomplete", rank, rank + 50);
 
      for (const item of suggestions) {
        if (!item.startsWith(query)) break;
        if (item.endsWith("*")) {
          results.push(item.substring(0, item.length - 1));
        }
      }
    }
    

    return c.json({ results });
  } catch (err) {
    console.error(err);
    return c.json({ results: [], message: "Something went wrong." }, { status: 500 });
  }
});

export const GET = handle(app);
export default app as never;
