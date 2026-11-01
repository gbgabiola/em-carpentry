export function POST() {
  return Response.json(
    {
      error:
        "Online review submissions are disabled until the retention policy is agreed.",
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
