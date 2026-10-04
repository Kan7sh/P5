export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET() {
  const ref = db.collection("stats").doc("visits");

  await ref.set(
    {
      count: FieldValue.increment(1),
    },
    { merge: true },
  );

  const snap = await ref.get();

return Response.json(
  {
    visits: snap.data()?.count ?? 0,
  },
  {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  }
);
}
