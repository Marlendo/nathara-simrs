import { redirect } from "next/navigation";
/** DIMATIKAN (K13 migrasi SSO): portal pasien NON-AKTIF default -> /login SSO. */
export default function DisabledPortalPage() { redirect("/login"); }
