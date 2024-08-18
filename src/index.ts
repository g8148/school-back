import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { auth } from "./protected_routes";

new Elysia({ prefix: "/api" })
  .use(swagger())
  .use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    }),
  )
  .use(auth)
  .listen(3333);

console.log("Server running at http://localhost:3333");
