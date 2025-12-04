// Database connection pool for the proxy service.
// 
// This module is responsible for:
// - Reading the Postgres connection details from AWS Secrets Manager
// - Loading the RDS CA certificates from disk
// - Creating and exporting a singleton `Pool` instance with TLS enabled
//
// The exported `dbPool` is used by query/transaction helpers in this service.
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

// RDS bundle + Amazon root CA used to validate the TLS connection to Postgres.
const caCert = fs.readFileSync(path.join(__dirname, 'cert', 'global-bundle.pem')).toString();
// const atsRoot = fs.readFileSync(path.join(__dirname, 'cert', 'AmazonRootCA1.pem'),'utf8');
const atsRoot = fs.readFileSync(path.join(__dirname, 'cert', 'AmazonRootCA1.pem')).toString(); // disable ca: caCert, enalble require:true

// Name of the Secrets Manager secret that stores DB credentials.
// This is injected via the `DB_SECRET` environment variable so different
// environments (dev, test, prod) can point at different secrets.
const secret_name = process.env.DB_SECRET;

/**
 * Initialise a Postgres connection pool by:
 *  - Fetching credentials from AWS Secrets Manager
 *  - Creating a `pg.Pool` configured with TLS using the local CA bundle
 *
 * The function deliberately throws on any failure so the service fails fast
 * at startup rather than running with a misconfigured database connection.
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
      database: 'proxy_db',
      max: 10,
      idleTimeoutMillis: 30000,
      // ssl: { rejectUnauthorized: false }, // quick fix
      ssl: {
        require: true,
        rejectUnauthorized: true,
        ca: caCert,
        // servername: secret.host,
      },
    });
    return pool;
  } catch (error) {
    // For a list of exceptions thrown, see
    // https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
    throw error;
  }
}

// Export a single, shared `Pool` instance that is initialised once at module load.
export const dbPool = await initPool();