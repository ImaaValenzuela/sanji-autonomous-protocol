import { getCommandSnapshot } from "@sanji/database";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await getCommandSnapshot();
  return Response.json(snapshot);
}
