import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { eq, sql, desc } from "drizzle-orm";
import { db } from "./db/db";
import { eventClass, events, users } from "./db/schema";

// Everything in this const will be protected
const protected_routes = new Elysia().group("/events", (app) =>
  app
    .get(
      "/:id",
      async ({ params: { id } }) => {
        const turmas = await db
          .select()
          .from(eventClass)
          .where(eq(eventClass.eventId, id))
          .orderBy(eventClass.className);

        const nomeEvento = await db
          .select({ eventName: events.eventName })
          .from(events)
          .where(eq(events.id, id));

        return { turmas, nomeEvento };
      },
      {
        params: t.Object({ id: t.Numeric() }),
      },
    )
    .get("/", () => {
      return db.query.events.findMany({
        columns: {
          id: true,
          eventName: true,
        },
        extras: {
          createAt: sql`TO_CHAR(${events.createAt}, 'DD/MM/YYYY')`.as(
            "createAt",
          ),
          totalEntriesSum: sql`
        COALESCE((
          SELECT SUM(ec.total_entries)
          FROM ${eventClass} ec
          WHERE ec.event_id = ${events.id}
        ), 0)
        `.as("totalEntriesSum"),
        },
        with: {
          eventClasses: {
            columns: {
              className: true,
              totalEntries: true,
            },
          },
        },
        orderBy: [desc(events.createAt)],
      });
    })
    .post(
      "/new-event",
      async ({ body }) => {
        const { eventInfos } = body;

        const eventResponse = await db
          .insert(events)
          .values({
            eventName: eventInfos.eventName,
          })
          .returning({ id: events.id });

        await db.insert(eventClass).values([
          { eventId: eventResponse[0].id, className: "311" },
          { eventId: eventResponse[0].id, className: "312" },
          { eventId: eventResponse[0].id, className: "313" },
          { eventId: eventResponse[0].id, className: "314" },
        ]);
      },
      {
        body: t.Object({
          eventInfos: t.Object({
            eventName: t.String(),
          }),
        }),
      },
    )
    .delete(
      "/:id",
      async ({ params: { id } }) => {
        await db.delete(eventClass).where(eq(eventClass.eventId, id));
        await db.delete(events).where(eq(events.id, id));
      },
      {
        params: t.Object({
          id: t.Numeric(),
        }),
      },
    )
    .patch(
      "/:id",
      ({ params: { id }, body }) => {
        return db
          .update(events)
          .set({ eventName: body.eventName })
          .where(eq(events.id, id));
      },
      {
        params: t.Object({ id: t.Numeric() }),
        body: t.Object({ eventName: t.String() }),
      },
    )
    .group("/classes", (app) =>
      app
        .post(
          "/new-class",
          async ({ body }) => {
            const { classInfos } = body;
            await db.insert(eventClass).values({
              eventId: classInfos.eventId,
              className: classInfos.className,
              totalEntries: classInfos.totalEntries,
              soldEntries: classInfos.soldEntries,
            });
          },
          {
            body: t.Object({
              classInfos: t.Object({
                eventId: t.Number(),
                className: t.String(),
                totalEntries: t.Number(),
                soldEntries: t.Number(),
              }),
            }),
          },
        )
        .delete(
          "/:id",
          async ({ params: { id } }) => {
            await db.delete(eventClass).where(eq(eventClass.id, id));
          },
          {
            params: t.Object({ id: t.Numeric() }),
          },
        )
        .patch(
          "/:id",
          ({ params: { id }, body, error }) => {
            const { className, soldEntries, totalEntries } = body;
            if (soldEntries > totalEntries) {
              return error(
                400,
                "O número de ingressos vendidos não pode ser maior do que o número de ingressos totais.",
              );
            }

            return db
              .update(eventClass)
              .set({ className, totalEntries, soldEntries })
              .where(eq(eventClass.id, id));
          },
          {
            params: t.Object({ id: t.Numeric() }),
            body: t.Object({
              className: t.String(),
              totalEntries: t.Numeric(),
              soldEntries: t.Numeric(),
            }),
          },
        ),
    ),
);

export const auth = new Elysia()
  .use(
    jwt({
      name: "jwt",
      secret:
        "This Spot Marks Our Grave... But You May Rest Here Too, If You Like.",
    }),
  )
  .post(
    "/login",
    async ({ jwt, body, cookie: { auth }, error }) => {
      const query = await db
        .select()
        .from(users)
        .where(eq(users.name, body.username));
      const { name, password } = query[0];
      if (
        body.username === name &&
        (await Bun.password.verify(body.password, password))
      ) {
        auth.set({
          value: await jwt.sign(body),
          httpOnly: true,
          maxAge: 3600 * 4, // 4 hours
          sameSite: "lax",
        });
      } else {
        return error(404, "User not found.");
      }
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    },
  )
  .derive(async ({ jwt, cookie: { auth }, set }) => {
    console.log(auth);
    if (!auth.value) {
      set.status = 401;
      console.log("Access token is missing");
      throw new Error("Access token is missing");
    }
    const jwtPayload = await jwt.verify(auth.value);
    if (!jwtPayload) {
      set.status = 403;
      console.log("Access token is invalid");
      throw new Error("Access token is invalid");
    }
  })
  .post(
    "/create-account",
    async ({ body }) => {
      return await Bun.password.hash(body.password);
    },
    {
      body: t.Object({
        password: t.String(),
      }),
    },
  )
  .use(protected_routes);
