import { rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "packages/database/data/runtime-leads.json");
rmSync(file, { force: true });
console.log("Demo store cleared. The next read reseeds the five CABA restaurants.");
