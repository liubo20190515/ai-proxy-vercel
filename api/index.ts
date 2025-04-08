import { handle } from "hono/vercel"; // Use the generic Vercel adapter for Edge
import app from "../dist/main.js"; // <-- Point back to compiled JS in dist

export default handle(app);
