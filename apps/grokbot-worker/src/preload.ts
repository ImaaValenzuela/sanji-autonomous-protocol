import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const srcDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(srcDir, "../../../.env") });
dotenv.config();
