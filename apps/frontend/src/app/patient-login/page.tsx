import { redirect } from "next/navigation";
/** DIMATIKAN (K13/K9 migrasi SSO): registrasi mandiri + login terpisah NON-AKTIF -> /login SSO. */
export default function DisabledAuthPage() { redirect("/login"); }
