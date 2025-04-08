import { handle } from "hono/vercel"; // Use the generic Vercel adapter for Edge
import app from "../main.js"; // Point to the main file

export default handle(app);
