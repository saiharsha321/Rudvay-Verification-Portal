import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/client";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";

const DEFAULT_EVENTS = [
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
  try {
    if (db) {
      const snap = await getDocs(collection(db, "events"));
      const docsList = snap.docs.map(d => d.data());
      if (docsList.length > 0) {
        return NextResponse.json(docsList);
      }
    }
  } catch (err: any) {
    console.warn("Firestore events GET notice:", err);
  }
  return NextResponse.json(DEFAULT_EVENTS);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventId = `ev_${Date.now()}`;
    const newEvent = {
      eventId,
      name: body.name || "New Event",
      description: body.description || "",
      date: body.date || new Date().toISOString().split("T")[0],
      duration: body.duration || "20 Hours",
      status: "ACTIVE",
      createdAt: new Date().toISOString()
    };

    if (db) {
      await setDoc(doc(db, "events", eventId), newEvent, { merge: true });
    }

    return NextResponse.json(newEvent, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}
