"use client";
import { useActionState, type ReactNode } from "react";
import type { ActionResult } from "@/lib/validation/schemas";
export function ActionForm({
  action,
  children,
  label = "Save",
}: {
  action: (state: ActionResult, data: FormData) => Promise<ActionResult>;
  children: ReactNode;
  label?: string;
}) {
  const [state, submit, pending] = useActionState(action, {});
  return (
    <form action={submit} className="owner-form" aria-busy={pending}>
      <fieldset disabled={pending}>
        {children}
        <button className="button button-primary" type="submit">
          {pending ? "Saving…" : label}
        </button>
      </fieldset>
      <div aria-live="polite" role="status">
        {state.error && <p className="form-message">{state.error}</p>}
        {state.success && <p className="form-message">{state.success}</p>}
      </div>
    </form>
  );
}
