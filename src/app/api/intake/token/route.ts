import { formTokenResponse } from "@/features/intake/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export function GET(request: Request) {
  return formTokenResponse(request);
}
