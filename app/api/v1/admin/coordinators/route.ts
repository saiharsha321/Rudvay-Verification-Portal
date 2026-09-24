import { NextRequest, NextResponse } from "next/server";
import { getAllCoordinators, saveCoordinator } from "@/lib/coordinators/store";

export async function GET(req: NextRequest) {
  try {
    const list = await getAllCoordinators();
    return NextResponse.json(list);
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to fetch coordinators" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email) {
      return NextResponse.json({ detail: "Name and Email address are required." }, { status: 400 });
    }

    const newCoord = await saveCoordinator({
      name,
      email,
      active: true,
      role: "COORDINATOR"
    });

    return NextResponse.json({
      success: true,
      message: `Coordinator '${name}' successfully provisioned and authorized.`,
      coordinator: newCoord
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to create coordinator" }, { status: 500 });
  }
}
