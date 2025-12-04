// Database connection pool for the user-plants service.
//
// Responsibilities:
// - Read Postgres connection details from AWS Secrets Manager
// - Load the RDS CA bundle from disk
// - Create and export a singleton `Pool` instance with TLS enabled
//
// Other modules import `dbPool` to run queries or open transactions.
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import 'dotenv/config';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
// import * as secretsClient from "./secrets";
const { Pool } = pg;

// Client used to fetch database credentials from Secrets Manager.
const client = new SecretsManagerClient({
  region: "ap-southeast-1",
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// RDS bundle and Amazon root CA used to validate the TLS connection.
const caCert = fs.readFileSync(path.join(__dirname, 'cert', 'global-bundle.pem')).toString();
// const atsRoot = fs.readFileSync(path.join(__dirname, 'cert', 'AmazonRootCA1.pem')).toString(); // disable "ca: caCert", enable "require:true"

// Secrets Manager identifier and logical DB name are injected via env vars
// so that different environments can use different secrets/databases.
const secret_name = process.env.DB_SECRET;
const DB_NAME = process.env.DB_NAME;

/**
 * Initialise a Postgres connection pool by fetching credentials from Secrets
 * Manager and constructing a `pg.Pool` configured for TLS.
 *
 * This function throws on any failure so the service fails fast at startup.
 */
async function initPool() {
  try {
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secret_name,
        VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
      })
    );
    const secret = JSON.parse(response.SecretString);

    const pool = new Pool({
      host: secret.host,
      port: secret.port,
      user: secret.username,
      password: secret.password,
      database: DB_NAME, //'user_plant_db',
      max: 10,
      idleTimeoutMillis: 30000,
      // ssl: { rejectUnauthorized: false }, // quick fix
      ssl: {
        require: true,
        rejectUnauthorized: true,
        ca: caCert,
        // servername: secret.host, // For rds proxy connection
      },
    });
    return pool;
  } catch (error) {
    throw error;
  }
}

// Export a single, shared `Pool` instance that is initialised once at module load.
export const dbPool = await initPool();