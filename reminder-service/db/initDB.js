// import { dbPool } from "./pool.js";

// export async function initRemindersDB() {
//   const client = await dbPool.connect();
//   try {
//     console.log("🧩 Initializing reminders DB...");

//     // --- Create schema + table ---
//     await client.query(`CREATE SCHEMA IF NOT EXISTS reminders;`);
//     await client.query(`SET search_path TO reminders, public;`);
//     await client.query(`
//       CREATE EXTENSION IF NOT EXISTS "pgcrypto";
//       CREATE TABLE IF NOT EXISTS reminder_list (
//         id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//         schedule_id     uuid NULL,
//         user_id         text NOT NULL,
//         name            text NOT NULL,
//         notes           text NULL,
//         is_proxy        boolean NOT NULL DEFAULT false,
//         proxy           text NULL,
//         due_at          timestamptz NOT NULL,
//         due_day         integer[] DEFAULT '{}'::integer[],
//         created_at      timestamptz NOT NULL DEFAULT NOW(),
//         updated_at      timestamptz NOT NULL DEFAULT NOW(),
//         sent_at         timestamptz NULL
//       );
//     `);

//     console.log("✅ reminders.reminder_list schema ready");

//     // --- Clear previous dummy data (dev only) ---
//     console.log("🧹 Clearing old reminder data...");
//     await client.query(`DELETE FROM reminders.reminder_list;`);

//     // --- Seed fresh dummy data ---
//     console.log("🌱 Seeding dummy reminders...");

//     await client.query(`
//       INSERT INTO reminders.reminder_list
//       (user_id, name, notes, is_proxy, proxy, due_at, due_day)
//       VALUES
//       -- One-time reminder due in 30 seconds
//       ('6a25e08c-1d70-4bef-98a7-dc3b52b9a213', 'Water the plants', 'Use filtered water', false, NULL, NOW() + INTERVAL '30 seconds', '{}'),

//       -- One-time reminder due in 5 minutes
//       ('6a25e08c-1d70-4bef-98a7-dc3b52b9a213', 'Fertilizer Time', 'Add compost to soil', false, NULL, NOW() + INTERVAL '5 minutes', '{}'),

//       -- Recurring reminder (Mon/Wed/Fri at 08:00)
//       ('6a25e08c-1d70-4bef-98a7-dc3b52b9a213', 'Morning Light', 'Move plants near sunlight', false, NULL,
//        date_trunc('day', NOW()) + TIME '08:00', '{1,3,5}'),

//       -- Recurring reminder (Daily proxy test)
//       ('6a25e08c-1d70-4bef-98a7-dc3b52b9a213', 'Proxy Reminder', 'Send this to proxy number', true, '91234567',
//        date_trunc('day', NOW()) + TIME '09:00', '{0,1,2,3,4,5,6}');
//     `);

//     console.log("✅ Dummy reminders inserted successfully!");

//   } catch (e) {
//     console.error("❌ initRemindersDB error:", e);
//   } finally {
//     client.release();
//   }
// }

// export default initRemindersDB;
