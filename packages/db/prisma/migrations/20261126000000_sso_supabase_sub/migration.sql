-- [migrasi SSO tahap-1] Aditif, JANGAN edit migrasi applied.
-- users.supabase_sub unique nullable + index; passwordHash -> nullable tahap-1.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "supabaseSub" TEXT;
DO $$ BEGIN
  BEGIN
    ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
  EXCEPTION WHEN others THEN NULL;
  END;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "User_supabaseSub_key" ON "User"("supabaseSub");
CREATE INDEX IF NOT EXISTS "User_supabaseSub_idx" ON "User"("supabaseSub");
-- UserSession dipertahankan tahap-1 (deprecated, hapus tahap-2). NOL drop di sini.
