/**
 * @file files.controller.ts
 * @path apps/backend/src/modules/files/files.controller.ts
 * @description Controller REST API files: endpoint HTTP. Upload/download file ke R2 (hasil lab, radiologi, lampiran).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Controller, Get, Param, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { SupabaseSsoGuard } from "../auth/supabase-sso.guard";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { PermissionsGuard } from "../../common/auth/permissions.guard";
import { PaginationQueryDto } from "../../common/pagination/pagination";
import { R2StorageService as MinioService } from "../../shared/storage/r2-storage.service";
// [migrasi R2] MinIO diganti R2StorageService (alias agar diff minimal).

import { FilesService } from "./files.service";

@ApiTags("files")
@ApiBearerAuth()
@UseGuards(SupabaseSsoGuard, PermissionsGuard)
@Controller("files")
export class FilesController {
  constructor(
    private readonly files: FilesService,
    private readonly minio: MinioService
  ) {}

  @RequirePermissions("files.read")
  @Get()
  async list(@Query() query: PaginationQueryDto) {
    const result = await this.files.list(query);
    return { success: true, data: result.data, meta: result.meta };
  }

  @RequirePermissions("files.read")
  @Get(":id")
  get(@Param("id") id: string) {
    return this.files.get(id);
  }

  @RequirePermissions("files.read")
  @Get(":id/download")
  async download(@Param("id") id: string, @Res() res: Response) {
    const file = await this.files.get(id);
    const { body: stream } = await this.minio.getObject(file.objectKey);
    res.setHeader("Content-Type", file.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(file.filename)}"`);
    (stream as NodeJS.ReadableStream).pipe(res);
  }

  @RequirePermissions("files.write")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary"
        }
      },
      required: ["file"]
    }
  })
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 10 * 1024 * 1024 }
    })
  )
  @Post("upload")
  upload(@CurrentUser("sub") actorId: string, @UploadedFile() file: Express.Multer.File) {
    return this.files.upload(actorId, file);
  }
}

