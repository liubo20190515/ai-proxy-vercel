import { handle } from "hono/vercel"; // Use the generic Vercel adapter for Edge
import app from "../main.ts"; // <-- Import source TS directly

export default handle(app);

// Explicitly configure the Vercel Edge Runtime
export const config = {
  runtime: "edge",
};

