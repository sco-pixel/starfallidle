import { createStarfallAuth } from "@/lib/better-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return createStarfallAuth(request.url).handler(request);
}

export async function POST(request: Request) {
  return createStarfallAuth(request.url).handler(request);
}
