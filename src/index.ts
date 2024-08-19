import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { auth } from "./protected_routes";
import { db } from "./db/db";
import { users } from "./db/schema";

new Elysia({ prefix: "/api" })
  .use(swagger())
  .use(
    cors({
      origin: true,
      credentials: true,
    }),
  )
  .post(
    "/first-acc",
    async ({ body: { username, password }, set }) => {
      const res = db.query.users.findFirst();
      if (await res) {
        set.status = 409;
        return;
      }

      await db.insert(users).values({
        name: username,
        password: await Bun.password.hash(password),
      });
      set.status = 201;
      return;
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    },
  )
  .use(auth)
  .listen(3333);

console.log("Server running at http://localhost:3333");
