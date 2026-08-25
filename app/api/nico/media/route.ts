import { NextResponse } from "next/server";
import { loadStoredMedia, verifyMediaToken } from "@/lib/nico/media-store";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ ok: false, error: { message: "missing token" } }, { status: 400 });
  }
  try {
    const claims = await verifyMediaToken(token);
    const obj = await loadStoredMedia(claims.key);
    if (!obj) {
      return NextResponse.json({ ok: false, error: { message: "not found" } }, { status: 404 });
    }
    return new NextResponse(obj.bytes, {
      headers: {
        "Content-Type": claims.mimeType,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: { message: "invalid token" } }, { status: 401 });
  }
}
