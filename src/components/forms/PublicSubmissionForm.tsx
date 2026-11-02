"use client";
import Link from "next/link";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  validateSubmission,
  type IntakeKind,
} from "@/features/intake/contracts";

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export function PublicSubmissionForm({
  kind,
  available,
}: {
  kind: IntakeKind;
  available: boolean;
}) {
  const prefix = useId();
  const [token, setToken] = useState("");
  const [tokenLoading, setTokenLoading] = useState(available);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [contactMethod, setContactMethod] = useState("email");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const noticeRef = useRef<HTMLParagraphElement>(null);
  const inFlight = useRef(false);
  const focusNotice = useRef(false);
  async function refreshToken() {
    setTokenLoading(true);
    try {
      const response = await fetch(`/api/intake/token?kind=${kind}`, {
        cache: "no-store",
        credentials: "omit",
        signal: AbortSignal.timeout(10000),
      });
      const body: unknown = await response.json();
      if (
        !response.ok ||
        typeof body !== "object" ||
        body === null ||
        !("token" in body) ||
        typeof body.token !== "string"
      )
        throw new Error();
      setToken(body.token);
      setNotice("");
    } catch {
      setNotice(
        "The form is temporarily unavailable. Please call, email or use the business Facebook page.",
      );
    } finally {
      setTokenLoading(false);
    }
  }
  useEffect(() => {
    if (!available) return;
    let active = true;
    const controller = new AbortController();
    void fetch(`/api/intake/token?kind=${kind}`, {
      cache: "no-store",
      credentials: "omit",
      signal: controller.signal,
    })
      .then(async (response) => {
        const body: unknown = await response.json();
        if (
          !response.ok ||
          typeof body !== "object" ||
          body === null ||
          !("token" in body) ||
          typeof body.token !== "string"
        )
          throw new Error();
        if (active) {
          setToken(body.token);
          setTokenLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setNotice(
            "The form is temporarily unavailable. Please use the direct contact options.",
          );
          setTokenLoading(false);
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [available, kind]);
  useEffect(() => {
    if (!focusNotice.current || !notice) return;
    const firstInvalid = Object.keys(errors)[0];
    const field = firstInvalid
      ? document.getElementById(`${prefix}-${firstInvalid}`)
      : null;
    if (field && !field.matches(":disabled")) field.focus();
    else noticeRef.current?.focus();
  }, [notice, errors, prefix]);
  const id = (name: string) => `${prefix}-${name}`;
  const attrs = (name: string) => ({
    id: id(name),
    name,
    "aria-invalid": !!errors[name],
    "aria-describedby": errors[name] ? `${id(name)}-error` : undefined,
  });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || !available || !token || sent) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const data =
      kind === "enquiry"
        ? {
            name: values.get("name"),
            contact_method: values.get("contact_method"),
            contact_details: values.get("contact_details"),
            description: values.get("description"),
            suburb: values.get("suburb") || "",
          }
        : {
            display_name: values.get("display_name"),
            rating: values.get("rating"),
            body: values.get("body"),
            consent: values.get("consent") === "on",
          };
    const parsed = validateSubmission(kind, data);
    focusNotice.current = true;
    setErrors({});
    if (!parsed.success) {
      setErrors(parsed.fieldErrors);
      setNotice("Please check the highlighted fields.");
      return;
    }
    inFlight.current = true;
    setPending(true);
    setNotice("");
    try {
      const response = await fetch(
        kind === "enquiry" ? "/api/enquiries" : "/api/reviews",
        {
          method: "POST",
          credentials: "omit",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            website: values.get("website") || "",
            data: parsed.data,
          }),
          signal: AbortSignal.timeout(15000),
        },
      );
      const body: unknown = await response.json();
      if (typeof body !== "object" || body === null) throw new Error();
      if (
        response.ok &&
        "success" in body &&
        typeof body.success === "string"
      ) {
        setSent(true);
        setNotice(body.success);
      } else {
        if (
          "fieldErrors" in body &&
          typeof body.fieldErrors === "object" &&
          body.fieldErrors !== null
        ) {
          const safe: Record<string, string> = {};
          for (const [key, value] of Object.entries(body.fieldErrors))
            if (typeof value === "string" && /^[a-z_]+$/.test(key))
              safe[key] = value;
          setErrors(safe);
        }
        if ("refreshToken" in body && body.refreshToken === true) setToken("");
        setNotice(
          "error" in body && typeof body.error === "string"
            ? body.error
            : "The form could not be submitted. Please try again.",
        );
      }
    } catch {
      // Keep the same token: the server may already have saved this request.
      setNotice(
        "We could not confirm the submission. Retry with the same details, or contact the business directly.",
      );
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }
  return (
    <form
      className="owner-form"
      onSubmit={submit}
      noValidate
      aria-busy={pending || tokenLoading}
      aria-describedby={id("information")}
    >
      <p id={id("information")} className="text-sm text-muted">
        {kind === "enquiry"
          ? "Share only what is needed to discuss your project. No attachments or customer account are needed. Please avoid sensitive information and full street addresses."
          : "Share genuine feedback about your own experience. Please leave out private contact details and other people's personal information. Feedback is moderated before publication."}
      </p>
      {!available && (
        <p className="form-message">
          Online submissions are not available yet. Please use the direct
          contact options.
        </p>
      )}
      <fieldset disabled={!available || !token || pending || sent}>
        <legend className="sr-only">
          {kind === "enquiry" ? "Quotation enquiry" : "Customer feedback"}
        </legend>
        {kind === "enquiry" ? (
          <>
            <Field id={id("name")} label="Your name" error={errors.name}>
              <input
                {...attrs("name")}
                required
                maxLength={100}
                autoComplete="name"
              />
            </Field>
            <Field
              id={id("contact_method")}
              label="How should we contact you?"
              error={errors.contact_method}
            >
              <select
                {...attrs("contact_method")}
                value={contactMethod}
                onChange={(event) => setContactMethod(event.target.value)}
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </select>
            </Field>
            <Field
              id={id("contact_details")}
              label={
                contactMethod === "email" ? "Email address" : "Phone number"
              }
              error={errors.contact_details}
            >
              <input
                {...attrs("contact_details")}
                type={contactMethod === "email" ? "email" : "tel"}
                required
                maxLength={contactMethod === "email" ? 320 : 30}
                autoComplete={contactMethod === "email" ? "email" : "tel"}
              />
            </Field>
            <Field
              id={id("description")}
              label="Tell us about your project"
              error={errors.description}
            >
              <textarea
                {...attrs("description")}
                required
                minLength={10}
                maxLength={5000}
                rows={5}
              />
            </Field>
            <Field
              id={id("suburb")}
              label="Suburb (optional)"
              error={errors.suburb}
            >
              <input
                {...attrs("suburb")}
                maxLength={120}
                autoComplete="address-level2"
              />
            </Field>
          </>
        ) : (
          <>
            <Field
              id={id("display_name")}
              label="Name to display with your review"
              error={errors.display_name}
            >
              <input
                {...attrs("display_name")}
                required
                maxLength={100}
                autoComplete="nickname"
              />
            </Field>
            <Field id={id("rating")} label="Your rating" error={errors.rating}>
              <select {...attrs("rating")} required defaultValue="">
                <option value="" disabled>
                  Select a rating
                </option>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} out of 5
                  </option>
                ))}
              </select>
            </Field>
            <Field id={id("body")} label="Your feedback" error={errors.body}>
              <textarea {...attrs("body")} required maxLength={3000} rows={5} />
            </Field>
            <Field
              id={id("consent")}
              label="Publication permission"
              error={errors.consent}
            >
              <label className="checkbox-label">
                <input {...attrs("consent")} type="checkbox" required />I
                consent to my display name, rating and feedback being published
                after moderation. I can withdraw this permission by contacting
                the business.
              </label>
            </Field>
          </>
        )}
        <div hidden aria-hidden="true">
          <label htmlFor={id("website")}>Leave this field empty</label>
          <input
            id={id("website")}
            name="website"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
        <p className="text-sm">
          <Link href="/privacy" className="text-link">
            Read how your information is used and retained
          </Link>
          .
        </p>
        <button className="button button-primary" type="submit">
          {pending
            ? "Sending…"
            : kind === "enquiry"
              ? "Send enquiry"
              : "Submit feedback"}
        </button>
      </fieldset>
      {tokenLoading && <p role="status">Preparing the form…</p>}
      <p
        ref={noticeRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className={notice ? "form-message" : undefined}
      >
        {notice}
      </p>
      {available && !token && !tokenLoading && !sent && (
        <button
          className="text-link"
          type="button"
          onClick={() => void refreshToken()}
        >
          Refresh form check
        </button>
      )}
      <noscript>
        <p>
          Online forms need JavaScript for their security check. Please call,
          email or use the business Facebook page instead.
        </p>
      </noscript>
    </form>
  );
}
