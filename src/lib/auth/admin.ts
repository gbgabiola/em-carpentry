import "server-only";
import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/db/server";

export async function requireAdmin() {
  const client = await createSessionClient();
  if (!client) redirect("/login?notice=setup");
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) redirect("/login");
  const membership = await client.rpc("is_admin");
  if (membership.error || membership.data !== true)
    redirect("/login?notice=denied");
  return client;
}
