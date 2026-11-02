export function POST() {
  return Response.json(
    {
      error:
        "Online enquiries are disabled until retention controls and secure intake are ready. Please contact the business directly.",
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
