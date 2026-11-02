import { submissionResponse } from "@/features/intake/server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return submissionResponse(request, "enquiry");
}
