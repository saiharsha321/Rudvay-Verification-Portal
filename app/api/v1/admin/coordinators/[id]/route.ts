import { NextRequest, NextResponse } from "next/server";
import { getCoordinator, saveCoordinator, toggleCoordinatorActive, deleteCoordinator } from "@/lib/coordinators/store";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    let updated = null;
    if (body.active !== undefined) {
      updated = await toggleCoordinatorActive(id, Boolean(body.active));
    } else {
      const existing = await getCoordinator(id);
      if (!existing) {
        return NextResponse.json({ detail: "Coordinator not found" }, { status: 404 });
      }
      updated = await saveCoordinator({
        ...existing,
        ...body,
        coordinatorId: id
      });
    }

    if (!updated) {
      return NextResponse.json({ detail: "Coordinator not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Coordinator '${updated.name}' updated successfully.`,
      coordinator: updated
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to update coordinator" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await deleteCoordinator(id);
    return NextResponse.json({
      success: true,
      message: "Coordinator deleted successfully."
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to delete coordinator" }, { status: 500 });
  }
}
