import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";
const sql = neon('postgresql://neondb_owner:npg_fi8t9HzqYvhg@ep-young-wildflower-a1qonkza-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');
export const db = drizzle(sql, { schema });
