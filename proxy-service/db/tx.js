import { dbPool } from "./pool.js";
import * as proxyQuery from "./query.js";
import * as proxyException from "../utils/exceptions.js";

// Re-exported `Pool` instance from `pool.js` used to acquire clients
// for the transactional functions below.
const pool = dbPool;

/**
 * Check whether the given `userID` is allowed to operate on the proxy record.
 *
 * Returns `true` if a matching row exists, otherwise throws a `ForbiddenError`
 * so that callers don't accidentally leak information about the existence of
 * other users' records.
 */
async function isElligible({ userID, id }) {
  console.log(userID, id);
  try {
    const { rows } = await pool.query(proxyQuery.isEligiblequery, [id, userID]);
    if (rows.length === 0) throw new proxyException.NotFoundError();
    return !!rows[0].eligible;
  } catch (e) {
    console.error("Error reading user: ", e);
    // Hide underlying reason from the caller and return a generic forbidden error.
    throw new proxyException.ForbiddenError();
  }
}

/**
 * Create a new proxy entry inside a transaction.
 *
 * On success the function commits and returns the new proxy ID.
 * On failure it rolls back the transaction and rethrows the error.
 */
async function createProxy({ userID, name, startDate, endDate, phoneNumber }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const values = [userID, name, startDate, endDate, phoneNumber];
    const result = await client.query(proxyQuery.insertQuery, values);

    const reminderID = result.rows[0].id;

    await client.query("COMMIT");
    return reminderID;
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    throw e;
  } finally {
    client.release();
  }
}

// NOT FOR PROD – debug helper to fetch a single proxy by ID regardless of user.
async function getProfileByID({ id }) {
  const client = await pool.connect();
  try {

    const result = await client.query(proxyQuery.devSelectByIDQuery, [id]);
    if (result.rowCount === 0) {
      throw new proxyException.NotFoundError();
    }
    
    return result.rows[0] || null;
  } catch (e) {
    console.error('Error reading agent: ', e)
      throw e;
  } finally {
    client.release();
  }
}
// NOT FOR PROD – debug helper to list all proxy records.
async function getAllProfiles() {
  const client = await pool.connect();
  try {

    const {rows} = await client.query(proxyQuery.devSelectAllQuery);
    
    return rows || null;
  } catch (e) {
    console.error('Error reading agent: ', e)
      throw e;
  } finally {
    client.release();
  }
}

/**
 * Fetch a single proxy record for a given user, enforcing ownership.
 */
async function getProxyByID({ id, userID }) {
  const client = await pool.connect();
  try {
    const ok = await isElligible({ userID, id});
    if (!ok) throw new proxyException.ForbiddenError();

    const result = await client.query(proxyQuery.selectByIDuserIDQuery, [id, userID]);
    
    return result.rows[0] || null;
  } catch (e) {
    console.error('Error reading agent: ', e)
      throw e;
  } finally {
    client.release();
  }
}

/**
 * List all proxies owned by a specific user, ordered by creation time.
 */
async function getProxysByUserID({ userID }) {
  const client = await pool.connect();
  try {
    const {rows} = await client.query(proxyQuery.getByUserIDQuery, [userID]);
    return rows || null;
  } catch (e) {
    console.error('Error reading agent: ', e)
      throw e;
  } finally {
    client.release();
  }
}


/**
 * Search proxies for a specific user by (optional) name filter with pagination.
 *
 * If no rows are found, a `NotFoundError` is thrown so the caller can map
 * this to a 404-style response.
 */
async function searchProxys({ userID, searchValue, limit, offset }) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(proxyQuery.searchQuery, [
      searchValue ? `%${searchValue}%` : null,
      userID, limit, offset
    ]);
    if (rows.length === 0) {
      throw new proxyException.NotFoundError();
    }
    console.log(rows);
    return rows || null;
  } catch (e) {
    console.error('Error reading plants: ', e)
      throw e;
  } finally {
    client.release();
  }
}

/**
 * Partially update a proxy record inside a transaction.
 *
 * Only non-undefined fields are included in the generated UPDATE statement.
 * If there is nothing to update the function returns `null` immediately.
 */
async function updateProxys({
  id,
  userID,
  name,
  startDate,
  endDate,
  phoneNumber,
}) {
  const client = await pool.connect();
  try {
    const ok = await isElligible({ userID, id});
    if (!ok) throw new proxyException.ForbiddenError();
    
    const fields = [];
    const values = [];
    let i = 1;

    // Helper to append a new "field = $n" fragment and its corresponding value.
    const push = (sqlFragment, value) => {
      fields.push(`${sqlFragment} $${++i}`);
      values.push(value);
    };

    if (name !== undefined) push('name =', name);
    if (startDate  !== undefined) push('start_date =',  startDate);
    if (endDate  !== undefined) push('end_date =',  endDate);
    if (phoneNumber  !== undefined) push('phone_number =',  phoneNumber);

    if (fields.length === 0) {
      // nothing to update
      return null;
    } 

    const params = [id, ...values];

    await client.query('BEGIN');

    const result = await client.query(await proxyQuery.dynamicUpdate(fields), params);
    if (result.rowCount === 0) {
      throw new proxyException.NoAffectedRowError();
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
 * Delete a proxy record belonging to a given user inside a transaction.
 *
 * The record must both exist and be owned by `userID`; otherwise an error is
 * thrown and the transaction is rolled back.
 */
async function deleteProxy({ id, userID }) {
  const client = await pool.connect();
  try {
    const ok = await isElligible({ id, userID, client});
    if (!ok) throw new Error('Not Elligible');

    await client.query('BEGIN');
    const result = await client.query(proxyQuery.deleteQuery, [id]);

    if (result.rowCount === 0) {
      throw new Error('Delete failed, not found ');
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

export { createProxy,
          getProxyByID, getProxysByUserID,
          searchProxys,
          updateProxys,
          deleteProxy
      };
