import { handle } from "@hono/node-server/vercel";
import app from "../main.js";

export default handle(app);
