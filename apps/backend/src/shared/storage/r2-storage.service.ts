/**
 * @file r2-storage.service.ts
 * @path apps/backend/src/shared/storage/r2-storage.service.ts
 * @description Storage R2 PROD (pengganti MinIO): S3-compatible, endpoint terkunci R2_* env + TLS.
 * ensureBucket HANYA verifikasi (JANGAN create via API). Kredensial HANYA dari file VPS.
 */
import { HeadBucketCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class R2StorageService {
  private readonly logger = new Logger(R2StorageService.name);
  public readonly client: S3Client;
  public readonly bucket: string;

  constructor(config: ConfigService) {
    const endpoint = config.getOrThrow<string>("R2_ENDPOINT");
    const accessKeyId = config.getOrThrow<string>("R2_ACCESS_KEY_ID");
    const secretAccessKey = config.getOrThrow<string>("R2_SECRET_ACCESS_KEY");
    this.bucket = config.get<string>("R2_BUCKET", "nathara-simrs");
    if (!endpoint.startsWith("https://")) {
      this.logger.warn("[r2] R2_ENDPOINT sebaiknya https (TLS wajib dokumen medis)");
    }
    this.client = new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: false
    });
  }

  /** Verifikasi akses bucket (HeadBucket). JANGAN create bucket via API — eskalasi user via plan. */
  async ensureBucket(): Promise<void> {
    await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
  }

  async putObject(key: string, body: Uint8Array | Buffer, contentType?: string): Promise<void> {
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body as Uint8Array, ContentType: contentType }));
  }

  async getObject(key: string): Promise<{ body: unknown; contentType?: string }> {
    const out = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    return { body: out.Body, contentType: out.ContentType };
  }

  // Kompatibilitas interface lama MinIO (files.* memakai client.putObject/getObject + bucket):
  // sediakan proxy minimal agar migrasi bertahap tidak merusak build.
  get legacyClient(): { putObject: (bucket: string, key: string, body: Buffer, size: number, meta?: Record<string, string>) => Promise<unknown>; getObject: (bucket: string, key: string) => Promise<NodeJS.ReadableStream> } {
    const self = this;
    return {
      async putObject(_bucket: string, key: string, body: Buffer, _size: number, meta?: Record<string, string>) {
        await self.putObject(key, body, meta?.["Content-Type"]);
        return {};
      },
      async getObject(_bucket: string, key: string) {
        const { body } = await self.getObject(key);
        return body as NodeJS.ReadableStream;
      }
    };
  }
}
