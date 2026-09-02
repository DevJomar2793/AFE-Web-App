const DEFAULT_BACKEND_API_URL = "http://127.0.0.1:8000";

export async function GET() {
  const backendApiUrl = (
    process.env.BACKEND_API_URL ?? DEFAULT_BACKEND_API_URL
  ).replace(/\/+$/, "");

  try {
    const response = await fetch(
      `${backendApiUrl}/api/v1/inventory/all-items`,
      {
        cache: "no-store",
        headers: { Accept: "application/json" },
      },
    );

    if (!response.ok) {
      return Response.json(
        { detail: "The inventory service could not load inventory." },
        { status: response.status },
      );
    }

    const inventory: unknown = await response.json();
    return Response.json(inventory, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { detail: "The inventory service is unavailable." },
      { status: 502 },
    );
  }
}
