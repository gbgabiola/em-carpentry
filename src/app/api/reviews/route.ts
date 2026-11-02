export function POST() {
  return Response.json(
    {
      error:
        "Online review submissions are disabled until retention controls and secure intake are ready.",
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
