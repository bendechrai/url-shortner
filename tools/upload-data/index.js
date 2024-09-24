const fs = require("fs");
const csv = require("csv-parser");
const { Pool } = require("pg");

// PostgreSQL connection setup with increased timeouts for larger data handling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // For Neon connections with SSL enabled
  idleTimeoutMillis: 30000, // Increased idle timeout to 30 seconds
  connectionTimeoutMillis: 20000, // Increased connection timeout to 20 seconds
});

// Function to process and insert rows in batches
async function processRowsInBatches(rows, query) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      await client.query(query, row);
      if (i % 100 === 0 && i !== 0) {
        // Commit every 100 rows
        await client.query("COMMIT");
        await client.query("BEGIN"); // Start a new transaction
      }
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(`Transaction failed: ${err.message}`);
  } finally {
    client.release();
  }
}

async function insertUserInfo(userinfo) {
  const client = await pool.connect();
  try {
    const query = `
        INSERT INTO userinfo (
          ip, continent_code, continent_name, country_code, country_name, 
          state_prov, city, zipcode, latitude, longitude, isp, 
          organization, connection_type, timezone_name, timezone_offset, 
          timezone_current_time, languages, country_flag, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, 
          $6, $7, $8, $9, $10, 
          $11, $12, $13, $14, $15, 
          $16, $17, $18, NOW()
        ) RETURNING id;`;

    const values = [
      userinfo.ip || null,
      userinfo.continent_code || null,
      userinfo.continent_name || null,
      userinfo.country_code || null,
      userinfo.country_name || null,
      userinfo.state_prov || null,
      userinfo.city || null,
      userinfo.zipcode || null,
      userinfo.latitude || null,
      userinfo.longitude || null,
      userinfo.isp || null,
      userinfo.organization || null,
      userinfo.connection_type || null,
      userinfo.timezone_name || null,
      userinfo.timezone_offset || null,
      userinfo.timezone_current_time || null,
      userinfo.languages || null,
      userinfo.country_flag || null,
    ];

    const res = await client.query(query, values);
    return res.rows[0].id;
  } catch (err) {
    console.error(`Error inserting userinfo: ${err.message}`);
  } finally {
    client.release();
  }
}

// Function to import redirects
async function importRedirects(csvFilePath) {
  const query =
    "INSERT INTO redirects (shortcode, dest) VALUES ($1, $2) ON CONFLICT (shortcode) DO NOTHING";
  const rows = [];

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on("data", (row) => {
      const shortcode = row.shortcode.replace(/"/g, ""); // Remove quotes
      const dest = row.dest.replace(/"/g, "");
      rows.push([shortcode, dest]); // Add the row to the batch
    })
    .on("end", async () => {
      if (rows.length > 0) {
        await processRowsInBatches(rows, query); // Process rows in batches
        console.log("Redirects data import completed.");
      } else {
        console.log("No redirects data found in the CSV.");
      }
    });
}

async function importRequests(csvFilePath) {
  const query = `
      INSERT INTO requests (
        shortcode, dest, useragent, ipaddress, timestamp, referrer, userinfoId
      ) VALUES ($1, $2, $3, $4, $5, $6, $7);`;

  const rows = [];
  const insertPromises = [];

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on("data", async (row) => {
      const shortcode = row.shortcode.replace(/"/g, "");
      const dest = row.dest ? row.dest.replace(/"/g, "") : null;
      const useragent = row.useragent ? row.useragent.replace(/"/g, "") : null;
      const ipaddress = row.ipaddress ? row.ipaddress.replace(/"/g, "") : null;
      const timestamp = row.timestamp ? row.timestamp.replace(/"/g, "") : null;
      const referrer = row.referrer ? row.referrer.replace(/"/g, "") : null;

      // Insert userinfo and get userinfoId
      const userinfoId = await insertUserInfo(row); // Always insert

      rows.push([
        shortcode,
        dest,
        useragent,
        ipaddress,
        timestamp,
        referrer,
        userinfoId,
      ]);
    })
    .on("end", async () => {
      if (rows.length > 0) {
        await processRowsInBatches(rows, query); // Process rows in batches
        console.log("Requests data import completed.");
      } else {
        console.log("No requests data found in the CSV.");
      }
      await pool.end(); // End the pool only after all data is processed
    });
}

// Call import functions
(async function () {
  try {
    console.log("Starting CSV data import...");
    await importRedirects("redirects.csv"); // Path to your redirects CSV file
    await importRequests("requests.csv"); // Path to your requests CSV file
  } catch (err) {
    console.error("Error in import:", err.message);
  }
})();
