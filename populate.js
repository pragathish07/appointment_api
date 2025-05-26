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

/* const filePath = path.join(__dirname, 'data3.csv'); // Your uploaded CSV filename

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

seedFromCSV(); */

const titles = [
   "MG - Saint-Jean 25/101",
  "MG - Saint-Jean 25/102",
  "Van Hammée 73 A3 duplex JV",
  "Hopital WOO/Xtel",
  "PIERRE FLAMAND TCA/TCA P",
  "Baron AM/TCA",
  "A.S Avenue de l'Europe 19/012 6000 Charleroi",
  "ED- Rue d'Italie 2",
  "ED - Paix",
  "MG - Saint-Jean 25/202",
  "Stu Dew TT",
  "ED- Mons 86",
  "Florentina A1 VK",
  "SN VenelleRobertBrout",
  "E.K Rue des Alliés 7080 Frameries",
  "Faya25 A1 VK",
  "DIX METRES AM/TC",
  "Braby A2 TT",
  "MONTGOLFIER / RF / WSP",
  "Roosendael - 2ch - N",
  "Abeille WOO/JFB",
  "Florida 1 M5 WOO/XTEL",
  "Bélier Villa 4F",
  "ED - Delalieux",
  "ED - Delalieux 23",
  "Rotsomy M4 EI",
  "SN - JacquesSermon14",
  "A.S Rue des Carrières 73 6030 Marchienne-au-Pont",
  "Marby M4 ML",
  "Triangle TC/TC",
  "A.S Rue Pierre Bauwens 72 6030 Marchienne-au-Pont",
  "Vieux Moulin WOO/JFB",
  "Petit Paris AM/AM PA",
  "Goutty Bis M3 TT",
  "Commandant Ponthier / Etterbeeck/ RF",
  "SATURNE AM/AM PA",
  "Dernier Carré AM/AM NB",
  "MG - Chaussée de Mons 33",
  "Vecquée A2 EI",
  "A.S Rue Josph Fourneaux 2 6040 Jumet",
  "Sylvie A2 VK",
  "Monument, LSR",
  "A.S Boulevard Pierre Mayence 84 6000 Charleroi",
  "ED - Coparty 12",
  "Auderghem 330 A3 JV Triplex",
  "SN - Bosquet",
  "Bouge M4 TT/LL",
  "ED - Cheval Blanc",
  "Mony A1 4.32 ML",
  "L.P Chaussée de Châtelet 40, 6060 Gilly",
  "Orjo A1 56/12 ML",
  "Orji 56/17 c42 A2 ML"
]

const updateTitles = async () => {
  try {
    for (let i = 0; i < titles.length; i++) {
      await pool.query(
        `UPDATE properties SET title = $1 WHERE id = $2`,
        [titles[i], i + 1]
      );
    }
    console.log('✅ Titles updated successfully');
  } catch (err) {
    console.error('❌ Error updating titles:', err);
  } finally {
    await pool.end();
  }
};

updateTitles();
