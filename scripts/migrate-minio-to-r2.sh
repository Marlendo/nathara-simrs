#!/usr/bin/env sh
# Migrasi satu-kali MinIO -> R2 (bucket nathara-simrs) dengan checksum.
# STATUS: N/A untuk deploy fresh ini — tidak ada volume/container MinIO lama di VPS
# (docker volume ls tidak memuat simrs/minio; tidak ada objek lama).
# Bila kelak ada objek lama di volume MinIO prod-efektif: jalankan di jendela
# maintenance + backup, verifikasi checksum per objek, catat daftar termigrasi.
# Create bucket = eskalasi user via plan (DILARANG via API oleh agent).
set -eu
echo "[minio->r2] N/A: tidak ada objek MinIO lama (fresh deploy, R2 dipakai hari-1)."
