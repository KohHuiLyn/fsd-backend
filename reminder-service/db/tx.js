import { dbPool } from "./pool.js";
import * as reminderQuery from "./query.js";
import * as reminderException from "../utils/exceptions.js";

// Shared `Pool` instance from `pool.js` used to acquire clients for
// transactional operations in this module.
const pool = dbPool;

/**
 * Check whether the given `userID` is allowed to access the reminder record.
 *
 * Returns true if a matching row exists; otherwise throws a `ForbiddenError`
 * so callers cannot infer whether a reminder exists for another user.
 */
async function isElligible({ userID, id }) {
  console.log(userID, id);
  try {
    const { rows } = await pool.query(reminderQuery.isEligiblequery, [id, userID]);
    if (rows.length === 0) throw new reminderException.NotFoundError();
    return !!rows[0].eligible;
  } catch (e) {
    console.error("Error reading agent: ", e);
    throw new reminderException.ForbiddenError();
  }
}

/**
 * Create a new reminder for a user inside a database transaction.
 *
 * On success the transaction commits and the new reminder ID is returned.
 * On failure the transaction is rolled back and the error is rethrown.
 */
async function createReminder({ userID, name, notes, isActive, dueAt, dueDay, isProxy, proxy }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const values = [userID, name, notes, isActive, dueAt, dueDay, isProxy, proxy];
    const result = await client.query(reminderQuery.insertReminderQuery, values);

    const reminderID = result.rows[0].id;

    await client.query("COMMIT");
    return reminderID;
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    throw e;
  } finally {
    client.release();
  }
}

// NOT FOR PROD – debug helper to inspect a single reminder by ID.
async function getProfileByID({ id }) {
  const client = await pool.connect();
  try {
    const result = await client.query(reminderQuery.devSelectByIDQuery, [id]);
    if (result.rowCount === 0) {
      throw new reminderException.NotFoundError();
    }
    
    return result.rows[0] || null;
  } catch (e) {
    console.error('Error reading agent: ', e)
      throw e;
  } finally {
    client.release();
  }
}
// NOT FOR PROD – debug helper to list all reminders.
async function getAllProfiles() {
  const client = await pool.connect();
  try {
    const {rows} = await client.query(reminderQuery.devSelectAllQuery);
    
    return rows || null;
  } catch (e) {
    console.error('Error reading agent: ', e)
      throw e;
  } finally {
    client.release();
  }
}

/**
 * Fetch a single reminder by ID for the given user, enforcing ownership.
 */
async function getReminderByID({ id, userID }) {
  const client = await pool.connect();
  try {
    const ok = await isElligible({ userID, id});
    if (!ok) throw new reminderException.ForbiddenError();

    const result = await client.query(reminderQuery.selectByIDuserIDQuery, [id, userID]);
    
    return result.rows[0] || null;
  } catch (e) {
    console.error('Error reading agent: ', e)
      throw e;
  } finally {
    client.release();
  }
}

/**
 * List all reminders that belong to a specific user.
 */
async function getRemindersByUserID({ userID }) {
  const client = await pool.connect();
  try {
    const {rows} = await client.query(reminderQuery.getByUserIDQuery, [userID]);
    return rows || null;
  } catch (e) {
    console.error('Error reading agent: ', e)
      throw e;
  } finally {
    client.release();
  }
}

/**
 * Return reminders that should fire in the next `windowSec` seconds.
 *
 * This is primarily used by the scheduler service to pull work from the
 * reminder queue. Additional debug logging is included to make it easier
 * to reason about time-window logic in production.
 */
async function getRemindersDueSoon({ windowSec }) {
  const client = await pool.connect();
  try {
    console.log("🕒 Now:", new Date().toISOString(), "windowSec:", windowSec);

    const { rows: allRows } = await client.query(`
      SELECT id, name, due_at, due_day,
             EXTRACT(EPOCH FROM (due_at - NOW())) AS diff_sec
      FROM reminders.reminder_list
      ORDER BY due_at ASC
    `);
    console.log("📋 All reminders:", allRows.length);
    console.table(allRows.map(r => ({
      id: r.id, name: r.name, due_at: r.due_at, due_day: r.due_day, diffSec: r.diff_sec
    })));

    const { rows } = await client.query(reminderQuery.getDueSoonQuery, [windowSec]);
    console.log("✅ getDueSoon rows:", rows.length);
    return rows || [];
  } catch (e) {
    console.error("❌ Error fetching due reminders:", e);
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Partially update a reminder inside a transaction.
 *
 * Only non-undefined fields are included in the generated UPDATE statement.
 * If there is nothing to update the function returns `null` immediately.
 */
async function updateReminder({
  id,
  userID,
  name,
  notes,
  isActive,
  dueAt,
  dueDay,
  isProxy,
  proxy,
}) {
  const client = await pool.connect();
  try {
    const ok = await isElligible({ userID, id});
    if (!ok) throw new reminderException.ForbiddenError();
    
    const fields = [];
    const values = [];
    let i = 1;

    // Helper to append a new "field = $n" fragment and its corresponding value.
    const push = (sqlFragment, value) => {
      fields.push(`${sqlFragment} $${++i}`);
      values.push(value);
    };

    if (name !== undefined) push('name =', name);
    if (notes  !== undefined) push('notes =',  notes);
    if (isActive  !== undefined) push('is_active =',  isActive);
    if (isActive  !== undefined) push('is_active =',  isActive);
    if (dueAt  !== undefined) push('due_at =',  dueAt);
    if (dueDay  !== undefined) push('due_day =',  dueDay);
    if (isProxy  !== undefined) push('is_proxy =',  isProxy);
    if (proxy  !== undefined) push('proxy =',  proxy);

    if (fields.length === 0) {
      // nothing to update
      return null;
    } 

    const params = [id, ...values];

    await client.query('BEGIN');

    const result = await client.query(await reminderQuery.dynamicUpdate(fields), params);
    if (result.rowCount === 0) {
      throw new reminderException.NoAffectedRowError();
    }
    await client.query("COMMIT");
    return result.rows[0] || null;
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
      throw e;
  } finally {
    client.release();
  }
}

/**
 * Delete a reminder belonging to a given user inside a transaction.
 *
 * The reminder must exist and belong to `userID`; otherwise an error is
 * thrown and the transaction is rolled back.
 */
async function deleteReminder({ id, userID }) {
  const client = await pool.connect();
  try {
    const ok = await isElligible({ id, userID, client});
    if (!ok) throw new Error('Not Elligible');

    await client.query('BEGIN');
    const result = await client.query(reminderQuery.deleteQuery, [id]);

    if (result.rowCount === 0) {
      throw new Error('Soft delete failed, not found ');
    }
    await client.query("COMMIT");
    return result.rows[0];
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
      throw e;
  } finally {
    client.release();
  }
}

export { createReminder,
          getReminderByID, getRemindersByUserID, getRemindersDueSoon,
          updateReminder,
          deleteReminder
      };
