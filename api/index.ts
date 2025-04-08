import { handle } from "hono/vercel"; // Use the generic Vercel adapter for Edge
import app from "../dist/main.js"; // <-- Updated path to compiled JS

export default handle(app);
