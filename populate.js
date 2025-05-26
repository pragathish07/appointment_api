const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'umhre9bpwaa0kdlwaffy',
  host: 'brcn63rrvzidwfsxpiiz-postgresql.services.clever-cloud.com',
  database: 'brcn63rrvzidwfsxpiiz',
  password: 'BQntnQejUZvCo4v3mKbKeLpzuVF142',
  port: 50013
});

const filePath = path.join(__dirname, 'data3.csv');

const seedFromCSV = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS properties (
      id SERIAL PRIMARY KEY,
      title TEXT,
      listing_url TEXT,
      bedrooms INTEGER,
      bathrooms INTEGER,
      area_sqm REAL,
      property_type TEXT,
      rent_eur INTEGER,
      status TEXT,
      energy_rating TEXT,
      agency TEXT
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
              title, listing_url, bedrooms, bathrooms, area_sqm, 
              property_type, rent_eur, status, energy_rating, agency
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              item["Titre du bien"],
              item["URL du bien"],
              parseInt(item["Nombre de chambres"]) || 0,
              parseInt(item["Nombre de salles de bain"]) || 0,
              parseFloat(item["Surface (m²)"]) || 0,
              item["Type de bien"],
              parseInt(item["Loyer (EUR)"]) || 0,
              item["Statut"],
              item["PEB"],
              item["Agence"]
            ]
          );
        }

        console.log("✅ CSV import completed successfully!");
      } catch (error) {
        console.error("❌ Error inserting into DB:", error);
      } finally {
        await pool.end();
      }
    });
};

seedFromCSV();
