/**
 * @file redis.service.ts
 * @path apps/backend/src/shared/redis/redis.service.ts
 * @description Koneksi Redis untuk cache dan sesi.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Injectable, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis | null;

  constructor(redisUrl?: string) {
    if (!redisUrl) {
      // REDIS_URL kosong = Redis tidak dipakai (compose default ${REDIS_URL:-}).
      // Mode nonaktif: seluruh operasi no-op agar boot tidak crash.
      this.client = null;
      return;
    }
    this.client = new Redis(redisUrl, { maxRetriesPerRequest: 3, lazyConnect: true });
    void this.client.connect().catch(() => undefined);
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error("Redis tidak dikonfigurasi (REDIS_URL kosong) — layanan nonaktif");
    }
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    if (ttlSeconds) {
      await this.client.set(key, value, "EX", ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    await this.client.del(key);
  }

  async sadd(key: string, member: string): Promise<void> {
    if (!this.client) return;
    await this.client.sadd(key, member);
  }

  async sismember(key: string, member: string): Promise<boolean> {
    if (!this.client) return false;
    return (await this.client.sismember(key, member)) === 1;
  }

  async publish(channel: string, message: string): Promise<void> {
    if (!this.client) return;
    await this.client.publish(channel, message);
  }

  async onModuleDestroy() {
    if (!this.client) return;
    await this.client.quit();
  }
}
