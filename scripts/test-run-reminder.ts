import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

console.log("🧪 Starting reminder test...");

import handler from "../api/cron.js";

const fakeReq = {};
const fakeRes = {
  status(code: number) {
    return {
      json(data: any) {
        console.log(`✅ Status: ${code}`);
        console.log("📦 Response:", data);
      },
    };
  },
};

try {
  await handler(fakeReq, fakeRes);
  console.log("✅ Handler finished without error");
} catch (err) {
  console.error("❌ Uncaught error during handler execution:");
  console.error(err);
}
