/**
 * @file storage.module.ts — migrasi R2 (pengganti MinIO).
 */
import { Global, Module } from "@nestjs/common";

import { MinioService } from "./minio.service";
import { R2StorageService } from "./r2-storage.service";

@Global()
@Module({ providers: [R2StorageService, MinioService], exports: [R2StorageService, MinioService] })
export class StorageModule {}
