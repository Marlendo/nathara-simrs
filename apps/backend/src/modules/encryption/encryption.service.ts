/**
 * @file encryption.service.ts
 * @path apps/backend/src/modules/encryption/encryption.service.ts
 * @description Service enkripsi fail-closed (C1/M1): throw bila env hilang di production, tolak kunci nol.
 */
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { createBlindIndex, decrypt, encrypt, getEncryptionKey } from "../../shared/encryption/crypto";

const ZERO_KEY_B64 = Buffer.alloc(32).toString("base64");

function requireKey(raw: string | undefined, name: string): string {
  if (!raw) {
    throw new Error(`[encryption] ${name} hilang — fail-closed (set via file VPS, JANGAN commit nilai)`);
  }
  if (raw === ZERO_KEY_B64 || raw === Buffer.alloc(32).toString("base64")) {
    throw new Error(`[encryption] ${name} kunci NOL ditolak — fail-closed`);
  }
  return raw;
}

@Injectable()
export class EncryptionService {
  private readonly key: Buffer;
  private readonly searchKey: Buffer;

  constructor(private readonly config: ConfigService) {
    const enc = requireKey(config.get<string>("ENCRYPTION_KEY"), "ENCRYPTION_KEY");
    const searchRaw = config.get<string>("ENCRYPTION_SEARCH_KEY") ?? enc;
    const search = requireKey(searchRaw, "ENCRYPTION_SEARCH_KEY");
    this.key = getEncryptionKey(enc);
    this.searchKey = getEncryptionKey(search);
    if (this.key.equals(Buffer.alloc(32)) || this.searchKey.equals(Buffer.alloc(32))) {
      throw new Error("[encryption] kunci NOL ditolak — fail-closed");
    }
  }

  encryptField(value: string): string { return encrypt(value, this.key); }
  decryptField(ciphertext: string): string { return decrypt(ciphertext, this.key); }
  blindIndex(value: string): string { return createBlindIndex(value, this.searchKey); }
  encryptOptional(value?: string | null): string | undefined {
    if (!value) return undefined;
    return this.encryptField(value);
  }
  decryptOptional(ciphertext?: string | null): string | undefined {
    if (!ciphertext) return undefined;
    try {
      return this.decryptField(ciphertext);
    } catch {
      throw new InternalServerErrorException("Gagal dekripsi field (kunci salah/rotasi gagal) — fail-closed");
    }
  }
}
