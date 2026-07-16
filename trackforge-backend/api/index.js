// import handler from "../src/server.js";

// export default handler;

// export default function handler(req, res) {
//   return res.status(200).send("Hello from Vercel");
// }

import app from "../src/app.js";
import { ensureDatabaseConnection } from "../src/server.js";

export default async function handler(req, res) {
  await ensureDatabaseConnection();

  return app(req, res);
}