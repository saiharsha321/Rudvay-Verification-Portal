import { NextRequest, NextResponse } from "next/server";
import { getTemplateByIdStore, saveTemplateStore, deleteTemplateStore } from "@/lib/templates/store";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const tpl = await getTemplateByIdStore(id);
    if (!tpl) {
      return NextResponse.json({ detail: "Template not found" }, { status: 404 });
    }
    return NextResponse.json(tpl);
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to get template" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const updated = await saveTemplateStore({
      templateId: id,
      name: body.name,
      pageSize: body.pageSize,
      orientation: body.orientation,
      designJson: body.designJson
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to update template" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const ok = await deleteTemplateStore(id);
    if (!ok) {
      return NextResponse.json({ detail: "Template not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Template deleted" });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to delete template" }, { status: 500 });
  }
}
