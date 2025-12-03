// db.js
// import pkg from "pg";
// const { Pool } = pkg;

// export const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   // optionally add SSL if using AWS RDS
//   ssl: { rejectUnauthorized: false },
// });


import pg from "pg";
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from 'url';
import 'dotenv/config';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
const { Pool } = pg;
const client = new SecretsManagerClient({
  region: "ap-southeast-1",
});

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// // const caCert = fs.readFileSync(path.join(__dirname, 'cert', 'global-bundle.pem')).toString();
// // const atsRoot = fs.readFileSync(path.join(__dirname, 'cert', 'AmazonRootCA1.pem'),'utf8');
// const atsRoot = fs.readFileSync(path.join(__dirname, 'cert', 'AmazonRootCA1.pem')).toString(); // disable ca: caCert, enalble require:true
// const secret_name = "itsa-db-service-user";
const secret_name = "itlm-proxy-service-user";

async function initPool() {
  try {
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secret_name,
        VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
      })
    );
    // const secret = response.SecretString;
    const secret = JSON.parse(response.SecretString);

    // const secret = await AWSSecret.getAWSSecret(secret_name);

    const pool = new Pool({
      host: secret.host,
      port: secret.port,
      user: secret.username,
      password: secret.password,
      database: 'user_db',
      max: 10,
      idleTimeoutMillis: 30000,
      // ssl: { rejectUnauthorized: false }, // quick fix
      ssl: {
        require: true,
        rejectUnauthorized: true,
        // ca: caCert,
        servername: secret.host,
      },
    });
    return pool;
  } catch (error) {
    // For a list of exceptions thrown, see
    // https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
    throw error;
  }
}

export const dbPool = await initPool();