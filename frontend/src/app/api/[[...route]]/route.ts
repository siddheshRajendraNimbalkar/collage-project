import { Hono } from "hono";
import { Redis } from "@upstash/redis";
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
    const { UPSTASH_REDIS_REST_TOKEN, UPSTASH_REDIS_REST_URL } = env<EnvConfig>(c) || {};
    if (!UPSTASH_REDIS_REST_TOKEN || !UPSTASH_REDIS_REST_URL) {
      return c.json({ results: [], message: "Missing Redis credentials" }, { status: 500 });
    }

    const redis = new Redis({
      token: UPSTASH_REDIS_REST_TOKEN,
      url: UPSTASH_REDIS_REST_URL,
    });

    const query = c.req.query("q")?.toUpperCase();
    if (!query) return c.json({ results: [], message: "Invalid search query" }, { status: 400 });

    console.log("Query:", query);
    const results: { id: string; name: string }[] = [];

    const rank = await redis.zrank("autocomplete", query);
    console.log("Rank:", rank);

    if (rank !== null) {
      const suggestions = await redis.zrange("autocomplete", rank, rank + 200);
      console.log("Suggestions:", suggestions);

      for (const item of suggestions) {
        if (typeof item !== 'string' || !item.startsWith(query)) break;

        let name = item;
        if (name.endsWith("*")) {
          name = name.substring(0, name.length - 1);
          const productIDs = await redis.zrange(`autocomplete:${name}`, 0, 1);
          
          // Ensure each product ID is unique in the results
          for (const productID of productIDs) {
            if (!results.some(result => result.id === productID)) {
              results.push({ id: productID as string, name });
            }
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
