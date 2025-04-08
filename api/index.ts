import { handle } from "hono/vercel"; // Use the generic Vercel adapter for Edge
import app from "../main.js"; // <-- Reverted path

export default handle(app);

