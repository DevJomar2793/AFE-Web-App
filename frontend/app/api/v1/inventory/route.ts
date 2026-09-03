const DEFAULT_BACKEND_API_URL = "http://127.0.0.1:8000";

export async function GET() {
  try {
    const response = await fetch(`${getBackendApiUrl()}/api/v1/inventory`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

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

export async function POST(request: Request) {
  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return Response.json(
      { detail: "The request body must be valid JSON." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(`${getBackendApiUrl()}/api/v1/inventory`, {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    const responseBody: unknown = await response.json();

    return Response.json(responseBody, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { detail: "The inventory service is unavailable." },
      { status: 502 },
    );
  }
}

function getBackendApiUrl() {
  return (process.env.BACKEND_API_URL ?? DEFAULT_BACKEND_API_URL).replace(
    /\/+$/,
    "",
  );
}
