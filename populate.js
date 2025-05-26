const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Pool } = require('pg');

// PostgreSQL connection settings — update accordingly
const pool = new Pool({
  user: 'umhre9bpwaa0kdlwaffy',
  host: 'brcn63rrvzidwfsxpiiz-postgresql.services.clever-cloud.com',
  database: 'brcn63rrvzidwfsxpiiz',
  password: 'BQntnQejUZvCo4v3mKbKeLpzuVF142',
  port: 50013
});

const filePath = path.join(__dirname, 'data3.csv'); // Your uploaded CSV filename

const seedFromCSV = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS properties (
      id SERIAL PRIMARY KEY,
      title TEXT,
      listing_url TEXT,
      price_eur INTEGER,
      property_type TEXT,
      bedrooms INTEGER,
      area_sqm REAL,
      energy_rating TEXT,
      status TEXT
    );
  `);

  const listings = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      listings.push(row);
    })
    .on('end', async () => {
      try {
        for (const item of listings) {
          await pool.query(
            `INSERT INTO properties (
              title, listing_url, price_eur, property_type,
              bedrooms, area_sqm, energy_rating, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              item["Titre du bien"],
              item["URL du bien"],
              parseInt(item["Prix (EUR)"]) || 0,
              item["Type de bien"],
              parseInt(item["Nombre de chambres"]) || 0,
              parseFloat(item["Surface (m2)"]) || 0,
              item["PEB"],
              item["Statut"]
            ]
          );
        }

        console.log('✅ Property data imported successfully!');
      } catch (err) {
        console.error('❌ Error inserting data:', err);
      } finally {
        await pool.end();
      }
    });
};

seedFromCSV();
