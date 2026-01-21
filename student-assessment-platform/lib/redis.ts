/**
 * Redis Client
 * 
 * Redis connection for caching, sessions, OTP storage, and job queues.
 * In development, gracefully handles missing Redis connection.
 * 
 * @module lib/redis
 */

import Redis from 'ioredis';
import * as fs from 'fs';
import * as path from 'path';

// In-memory fallback for development when Redis is not available
const memoryStore = new Map<string, { value: string; expiresAt: number }>();

// File-based cache for development (persists across Next.js processes)
const CACHE_DIR = path.join(process.cwd(), '.next', 'cache', 'redis-fallback');
const ensureCacheDir = () => {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
};

// File-based fallback functions (for development when Redis is not available)
async function fileGet(key: string): Promise<string | null> {
  ensureCacheDir();
  const filePath = path.join(CACHE_DIR, `${key.replace(/:/g, '_')}.json`);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`[File Cache] GET ${key}: file not found`);
      return null;
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (Date.now() > data.expiresAt) {
      console.log(`[File Cache] GET ${key}: expired (expired at ${new Date(data.expiresAt).toISOString()})`);
      fs.unlinkSync(filePath);
      return null;
    }
    console.log(`[File Cache] GET ${key}: found value=${data.value}, expires at ${new Date(data.expiresAt).toISOString()}`);
    return data.value;
  } catch (error) {
    console.error(`[File Cache] Error reading ${key}:`, error);
    return null;
  }
}

async function fileSetex(key: string, seconds: number, value: string): Promise<void> {
  ensureCacheDir();
  const filePath = path.join(CACHE_DIR, `${key.replace(/:/g, '_')}.json`);
  const expiresAt = Date.now() + seconds * 1000;
  
  try {
    fs.writeFileSync(filePath, JSON.stringify({ value, expiresAt }), 'utf-8');
    console.log(`[File Cache] SETEX ${key}: value=${value}, expires in ${seconds}s (at ${new Date(expiresAt).toISOString()})`);
  } catch (error) {
    console.error(`[File Cache] Error writing ${key}:`, error);
  }
}

async function fileDel(key: string): Promise<void> {
  ensureCacheDir();
  const filePath = path.join(CACHE_DIR, `${key.replace(/:/g, '_')}.json`);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[File Cache] DEL ${key}: deleted`);
    }
  } catch (error) {
    console.error(`[File Cache] Error deleting ${key}:`, error);
  }
}

async function fileIncr(key: string): Promise<number> {
  const current = await fileGet(key);
  const newValue = (current ? parseInt(current) : 0) + 1;
  await fileSetex(key, 900, newValue.toString());
  return newValue;
}

function getRedisUrl(): string {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }
  // For development, use default localhost Redis
  if (process.env.NODE_ENV === 'development') {
    return 'redis://localhost:6379';
  }
  // For build time, return a dummy URL
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return 'redis://localhost:6379';
  }
  throw new Error('REDIS_URL is not defined');
}

// Lazy initialization - only create Redis client when actually needed
let redisInstance: Redis | null = null;
let redisAvailable = false;

function initRedis(): Redis | null {
  if (redisInstance) {
    return redisInstance;
  }

  try {
    const redisUrl = getRedisUrl();
    redisInstance = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      enableOfflineQueue: false,
      lazyConnect: true,
      retryStrategy: () => null, // Don't retry
      connectTimeout: 2000, // 2 second timeout
    });

    redisInstance.on('error', (err) => {
      console.warn('⚠️  Redis connection error:', err.message);
      redisAvailable = false;
    });

    redisInstance.on('connect', () => {
      console.log('✅ Redis Client Connected');
      redisAvailable = true;
    });

    redisInstance.on('ready', () => {
      redisAvailable = true;
    });

    // Try to connect
    redisInstance.connect().catch(() => {
      console.warn('⚠️  Redis not available. Using in-memory fallback for development.');
      redisAvailable = false;
    });

    return redisInstance;
  } catch (error) {
    console.warn('⚠️  Redis initialization failed. Using in-memory fallback.');
    redisAvailable = false;
    return null;
  }
}

// Memory-based fallback functions
async function memoryGet(key: string): Promise<string | null> {
  const item = memoryStore.get(key);
  if (!item) {
    console.log(`[Memory Store] GET ${key}: not found`);
    return null;
  }
  if (Date.now() > item.expiresAt) {
    console.log(`[Memory Store] GET ${key}: expired (expired at ${new Date(item.expiresAt).toISOString()})`);
    memoryStore.delete(key);
    return null;
  }
  console.log(`[Memory Store] GET ${key}: found value=${item.value}, expires at ${new Date(item.expiresAt).toISOString()}`);
  return item.value;
}

async function memorySetex(key: string, seconds: number, value: string): Promise<void> {
  const expiresAt = Date.now() + seconds * 1000;
  memoryStore.set(key, {
    value,
    expiresAt,
  });
  console.log(`[Memory Store] SETEX ${key}: value=${value}, expires in ${seconds}s (at ${new Date(expiresAt).toISOString()})`);
  console.log(`[Memory Store] Current store size: ${memoryStore.size} entries`);
}

async function memoryIncr(key: string): Promise<number> {
  const current = await memoryGet(key);
  const newValue = (current ? parseInt(current) : 0) + 1;
  await memorySetex(key, 900, newValue.toString());
  return newValue;
}

async function memoryDel(key: string): Promise<void> {
  memoryStore.delete(key);
}

// Wrapper functions that use Redis if available, otherwise use memory
export const redis = {
  async get(key: string): Promise<string | null> {
    const client = initRedis();
    if (client && redisAvailable) {
      try {
        const value = await client.get(key);
        console.log(`[Redis] GET ${key}: ${value ? 'found' : 'not found'}`);
        return value;
      } catch (error) {
        console.warn('Redis get failed, using file cache fallback:', error);
        redisAvailable = false;
      }
    }
    // Use file cache in development (persists across processes)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Redis] Using file cache fallback for GET ${key}`);
      return fileGet(key);
    }
    console.log(`[Redis] Using memory fallback for GET ${key}`);
    return memoryGet(key);
  },

  async setex(key: string, seconds: number, value: string): Promise<void> {
    const client = initRedis();
    if (client && redisAvailable) {
      try {
        await client.setex(key, seconds, value);
        console.log(`[Redis] SETEX ${key}: stored successfully`);
        return;
      } catch (error) {
        console.warn('Redis setex failed, using file cache fallback:', error);
        redisAvailable = false;
      }
    }
    // Use file cache in development (persists across processes)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Redis] Using file cache fallback for SETEX ${key}`);
      await fileSetex(key, seconds, value);
      return;
    }
    console.log(`[Redis] Using memory fallback for SETEX ${key}`);
    await memorySetex(key, seconds, value);
  },

  async incr(key: string): Promise<number> {
    const client = initRedis();
    if (client && redisAvailable) {
      try {
        return await client.incr(key);
      } catch (error) {
        console.warn('Redis incr failed, using file cache fallback:', error);
        redisAvailable = false;
      }
    }
    // Use file cache in development (persists across processes)
    if (process.env.NODE_ENV === 'development') {
      return fileIncr(key);
    }
    return memoryIncr(key);
  },

  async expire(key: string, seconds: number): Promise<void> {
    const client = initRedis();
    if (client && redisAvailable) {
      try {
        await client.expire(key, seconds);
        return;
      } catch (error) {
        console.warn('Redis expire failed, using memory fallback:', error);
        redisAvailable = false;
      }
    }
    // Memory store handles expiration automatically
  },

  async del(key: string): Promise<void> {
    const client = initRedis();
    if (client && redisAvailable) {
      try {
        await client.del(key);
        return;
      } catch (error) {
        console.warn('Redis del failed, using file cache fallback:', error);
        redisAvailable = false;
      }
    }
    // Use file cache in development (persists across processes)
    if (process.env.NODE_ENV === 'development') {
      await fileDel(key);
      return;
    }
    await memoryDel(key);
  },
};

// Helper functions for common operations
export async function setSession(sessionId: string, data: any, ttl = 3600) {
  await redis.setex(`session:${sessionId}`, ttl, JSON.stringify(data));
}

export async function getSession(sessionId: string) {
  const data = await redis.get(`session:${sessionId}`);
  return data ? JSON.parse(data) : null;
}

export async function deleteSession(sessionId: string) {
  await redis.del(`session:${sessionId}`);
}

// Rate limiting helper
export async function checkRateLimit(
  key: string,
  limit: number,
  window: number
): Promise<boolean> {
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, window);
  }
  return current <= limit;
}
