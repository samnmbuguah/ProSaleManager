import { drizzle } from "drizzle-orm/node-postgres";
import pkg from 'pg';
const { Pool } = pkg;
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.NODE_ENV === 'development' 
  ? process.env.DATABASE_URL_DEV 
  : process.env.DATABASE_URL;

console.log(`Using database: ${process.env.NODE_ENV === 'development' ? 'prosaledatabase_dev' : 'prosaledatabase'}`);
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Database URL: ${databaseUrl?.replace(/:[^:@]+@/, ':****@')}`); // Hide password in logs

const pool = new Pool({ connectionString: databaseUrl });

export const db = drizzle(pool);
