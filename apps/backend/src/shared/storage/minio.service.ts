/**
 * @file minio.service.ts — DIMATIKAN (migrasi R2). MinIO DIHAPUS dari deploy.
 * Kelas dipertahankan sebagai alias deprecated ke R2StorageService agar import lama gagal eksplisit.
 */
import { Injectable } from "@nestjs/common";

import { R2StorageService } from "./r2-storage.service";

@Injectable()
export class MinioService {
  public readonly bucket: string;
  constructor(private readonly r2: R2StorageService) { this.bucket = this.r2.bucket; }
  get client(): unknown { return (this.r2 as unknown as { legacyClient: unknown }).legacyClient; }
  async ensureBucket(): Promise<void> { return this.r2.ensureBucket(); }
}
