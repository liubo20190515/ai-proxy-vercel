import { handle } from "hono/vercel"; // Use the generic Vercel adapter for Edge
import app from "../main"; // <-- Import without .ts extension

export default handle(app);

// Explicitly configure the Vercel Edge Runtime
export const config = {
  runtime: "edge",
};

