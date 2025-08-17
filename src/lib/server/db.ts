import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let _db: PostgresJsDatabase<typeof schema> | null = null;

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.error('DATABASE_URL environment variable is not set');
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    console.log('Connecting to database...');
    try {
      const queryClient = postgres(connectionString);
      _db = drizzle(queryClient, { schema });
      console.log('Database connection established successfully');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }
  
  return _db;
}

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  }
});