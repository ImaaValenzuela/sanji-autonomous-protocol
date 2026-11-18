import { getCommandSnapshot } from "@sanji/database";
import { CommandCenter } from "@/components/CommandCenter";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const snapshot = await getCommandSnapshot();
  return <CommandCenter initial={snapshot} />;
}
