import { handle } from "@hono/node-server/vercel";
import app from "../main.js"; // Point to the test file

export default handle(app);


