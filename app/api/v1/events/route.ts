import { NextRequest, NextResponse } from "next/server";

let eventsStore: any[] = [
  {
    eventId: "ev_cyber_2026",
    name: "Cyber Security & Cloud Architecture 2026",
    description: "Enterprise hands-on security workshop",
    date: "2026-09-08",
    duration: "24 Hours",
    status: "ACTIVE"
  },
  {
    eventId: "ev_python_ai",
    name: "Advanced Python & AI Engineering",
    description: "Deep learning & backend systems",
    date: "2026-09-08",
    duration: "30 Hours",
    status: "ACTIVE"
  }
];

export async function GET() {
  return NextResponse.json(eventsStore);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newEvent = {
      eventId: `ev_${Date.now()}`,
      name: body.name || "New Event",
      description: body.description || "",
      date: body.date || new Date().toISOString().split("T")[0],
      duration: body.duration || "20 Hours",
      status: "ACTIVE"
    };
    eventsStore.push(newEvent);
    return NextResponse.json(newEvent, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}
