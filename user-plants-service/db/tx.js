// import pool from "./pool.js";
import { dbPool } from "./pool.js";
import * as upQuery from "./query.js";
import * as upException from "../utils/exceptions.js";
import axios from "axios";
import axiosRetry from "axios-retry";
import FormData from "form-data";

axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

// Shared `Pool` instance from `pool.js` used to acquire clients for
// transactional operations in this module.
const pool = dbPool;

/**
 * Check whether the given `userID` is allowed to access the user-plant record.
 *
 * Returns true if a matching row exists; otherwise throws a `ForbiddenError`
 * so callers cannot infer whether a plant exists for another user.
 */
async function isElligible({ userID, id }) {
  console.log(userID, id);
  try {
    const { rows } = await pool.query(upQuery.isEligiblequery, [id, userID]);
    if (rows.length === 0) throw new upException.NotFoundError();
    return !!rows[0].eligible;
  } catch (e) {
    console.error("Error reading user: ", e);
    // throw e;
    throw new upException.ForbiddenError();
  }
}

const PHOTO_SERVICE_URL = process.env.PHOTO_URL;

/**
 * Call the photo-service to upload a file and return the resulting S3 URL/ID.
 *
 * Retries are handled via `axios-retry`. A 404 from photo-service is treated
 * as "no image" and returns null; other errors are logged and rethrown.
 */
export async function getS3ID({ file }) {
  try {
    const formData = new FormData();
    formData.append("file", file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    const response = await axios.post(`${PHOTO_SERVICE_URL}/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 2000,
    });
    return response.data.url;
  } catch (err) {
    if (err.response?.status === 404) return null;
    console.error("photo-service POST error:", err.message);
    throw err;
  }
}

/**
 * Create a new user-plant inside a database transaction.
 *
 * The image is first uploaded to the photo-service to obtain an S3 ID,
 * which is then stored alongside the plant metadata.
 */
async function createUserPlant({ userID, file, name, notes }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const s3ID = await getS3ID({file});

    const values = [userID, s3ID, name, notes];
    const result = await client.query(upQuery.insertupQuery, values);

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

// NOT FOR PROD – debug helper to inspect a single user-plant by ID.
async function getProfileByID({ id }) {
  const client = await pool.connect();
  try {


    const result = await client.query(upQuery.devSelectByIDQuery, [id]);
    if (result.rowCount === 0) {
      throw new upException.NotFoundError();
    }
    
    return result.rows[0] || null;
  } catch (e) {
    console.error('Error reading user: ', e)
      throw e;
  } finally {
    client.release();
  }
}
// NOT FOR PROD – debug helper to list all user-plants.
async function getAllProfiles() {
  const client = await pool.connect();
  try {


    const {rows} = await client.query(upQuery.devSelectAllQuery);
    
    return rows || null;
  } catch (e) {
    console.error('Error reading user: ', e)
      throw e;
  } finally {
    client.release();
  }
}

/**
 * Fetch a single user-plant by ID, enforcing that it belongs to the current user.
 */
async function getUserPlantByID({ id, userID }) {
  const client = await pool.connect();
  try {
    const ok = await isElligible({ userID, id});
    if (!ok) throw new upException.ForbiddenError();

    const result = await client.query(upQuery.selectByIDuserIDQuery, [id, userID]);
    
    return result.rows[0] || null;
  } catch (e) {
    console.error('Error reading user: ', e)
      throw e;
  } finally {
    client.release();
  }
}

/**
 * List all user-plants for a specific user.
 */
async function getUserPlantsByUserID({ userID }) {
  const client = await pool.connect();
  try {
    const {rows} = await client.query(upQuery.getByUserIDQuery, [userID]);
    return rows || null;
  } catch (e) {
    console.error('Error reading user: ', e)
      throw e;
  } finally {
    client.release();
  }
}


/**
 * Search user-plants for a specific user by name/notes with pagination.
 *
 * If no rows are found, a `NotFoundError` is thrown so callers can map this
 * to a 404-style response.
 */
async function searchUserPlants({ userID, searchValue, limit, offset }) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(upQuery.searchQuery, [
      searchValue ? `%${searchValue}%` : null,
      userID, limit, offset
    ]);
    if (rows.length === 0) {
      throw new upException.NotFoundError();
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
 * Partially update a user-plant inside a transaction.
 *
 * Only non-undefined fields are included in the generated UPDATE statement.
 * If there is nothing to update the function returns `null` immediately.
 */
async function updateUserPlants({ id, userID, s3ID, name, notes }) {
  const client = await pool.connect();
  try {
    const ok = await isElligible({ userID, id});
    if (!ok) throw new upException.ForbiddenError();
    
    const fields = [];
    const values = [];
    let i = 1;

    // Helper to append a new "field = $n" fragment and its corresponding value.
    const push = (sqlFragment, value) => {
      fields.push(`${sqlFragment} $${++i}`);
      values.push(value);
    };

    if (s3ID !== undefined) push('s3_id =', s3ID);
    if (name  !== undefined) push('name =',  name);
    if (notes  !== undefined) push('notes =',  notes);

    if (fields.length === 0) {
      // nothing to update
      return null;
    } 

    const params = [id, ...values];

    await client.query('BEGIN');

    const result = await client.query(await upQuery.dynamicUpdate(fields), params);
    if (result.rowCount === 0) {
      throw new upException.NoAffectedRowError();
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
 * Delete a user-plant belonging to a given user inside a transaction.
 *
 * The record must exist and belong to `userID`; otherwise an error is
 * thrown and the transaction is rolled back.
 */
async function deleteUserPlant({ id, userID }) {
  const client = await pool.connect();
  try {
    const ok = await isElligible({ id, userID, client});
    if (!ok) throw new Error('Not Elligible');

    await client.query('BEGIN');
    const result = await client.query(upQuery.deleteQuery, [id]);

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

export { createUserPlant,
          getUserPlantByID, getUserPlantsByUserID,
          searchUserPlants,
          updateUserPlants,
          deleteUserPlant
      };
