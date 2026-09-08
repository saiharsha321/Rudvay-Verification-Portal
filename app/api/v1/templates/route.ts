import { NextRequest, NextResponse } from "next/server";
import { getTemplatesStore, saveTemplateStore } from "@/lib/templates/store";

export async function GET(req: NextRequest) {
  try {
    const templates = getTemplatesStore();
    return NextResponse.json(templates);
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ detail: "Template name is required" }, { status: 400 });
    }
    const created = saveTemplateStore({
      name: body.name,
      pageSize: body.pageSize || "A4",
      orientation: body.orientation || "LANDSCAPE",
      designJson: body.designJson,
      ownerId: body.ownerId || "coordinator_1"
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to create template" }, { status: 500 });
  }
}
