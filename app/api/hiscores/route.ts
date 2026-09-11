import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { SKILL_IDS, type SkillId } from "@/lib/game-state";
import { getHiscores, type HiscoreCategory, type HiscoreScope } from "@/lib/hiscores";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedCategory = url.searchParams.get("category") ?? "overall";
  const category: HiscoreCategory = requestedCategory === "overall" || SKILL_IDS.includes(requestedCategory as SkillId)
    ? requestedCategory as HiscoreCategory
    : "overall";
  const requestedScope = url.searchParams.get("scope");
  const scope: HiscoreScope = requestedScope === "patrol" || requestedScope === "weekly" ? requestedScope : "all";
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const search = url.searchParams.get("search") ?? "";
  const user = await getChatGPTUser();

  try {
    const data = await getHiscores({
      category,
      scope,
      page: Number.isFinite(page) ? page : 1,
      search,
      userId: user?.userId,
    });
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unable to load hiscores", error);
    return NextResponse.json({ error: "Hiscores are temporarily unavailable." }, { status: 503 });
  }
}
