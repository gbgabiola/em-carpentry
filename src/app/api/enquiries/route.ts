export function POST() {
  return Response.json(
    {
      error:
        "Online enquiries are disabled until the retention policy is agreed. Please contact the business directly.",
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
