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
    if (!query) return c.json({ message: "Invalid search query" }, { status: 400 });

    const results: { id: string; name: string }[] = [];

    // Search in the sorted set
    const rank = await redis.zrank("autocomplete", query);
    console.log("Rank:", rank);
    if (rank !== null && rank !== undefined) {
      const suggestions = await redis.zrange("autocomplete", rank, rank + 50);
      console.log("Suggestions:", suggestions);
      const seenProducts = new Set<string>();

      for (const item of suggestions) {
        if (!(item as string).startsWith(query)) break;

        let name = item as string;
        if (name.endsWith("*")) {
          name = name.substring(0, name.length - 1);
        }

        const productIDs = await redis.zrange(`autocomplete:${name}`, 0, 1);

        if (productIDs.length > 0) {
          const productID = productIDs[0] as string;

          // Avoid adding duplicate product IDs
          if (!seenProducts.has(productID)) {
            results.push({ id: productID, name: suggestions[suggestions.length - 2] as string });
            seenProducts.add(productID);
          }
        }
      }



    }

    return c.json({ results });
  } catch (err) {
    console.error("Redis Error:", err);
    return c.json({ results: [], message: "Something went wrong." }, { status: 500 });
  }
});



export const GET = handle(app);
export default app as never;
