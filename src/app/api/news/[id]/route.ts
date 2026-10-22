import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { deleteArticle } from "@/db/queries";

// 뉴스 1건을 DB에서 삭제한다. (비로그인은 proxy에서도 막지만 직접 한 번 더 확인한다.)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const articleId = Number((await params).id);
  if (!Number.isInteger(articleId) || articleId <= 0) {
    return NextResponse.json({ error: "잘못된 뉴스 번호예요." }, { status: 400 });
  }

  try {
    const deleted = await deleteArticle(articleId);
    if (!deleted) {
      return NextResponse.json({ error: "삭제할 뉴스를 찾지 못했어요." }, { status: 404 });
    }
    revalidatePath("/dashboard");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/news/[id] failed", e);
    return NextResponse.json(
      { error: "삭제하지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
