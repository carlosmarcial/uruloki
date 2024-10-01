import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  try {
    const res = await fetch(
      `https://api.0x.org/swap/v1/price?${searchParams}`,
      {
        headers: {
          "0x-api-key": process.env.NEXT_PUBLIC_ZEROEX_API_KEY as string,
        },
      }
    );
    const data = await res.json();

    return Response.json(data);
  } catch (error) {
    console.error("Error fetching price:", error);
    return Response.json({ error: "Failed to fetch price" }, { status: 500 });
  }
}
