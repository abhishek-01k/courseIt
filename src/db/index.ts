import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// HTTP driver: one round trip per query, no connection pool to warm up on serverless.
export const db = drizzle(neon(process.env.DATABASE_URL!), { schema });
