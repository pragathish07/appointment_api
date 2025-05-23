require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Railway PostgreSQL connection
const pool = new Pool({
  user: 'postgres',
  host: 'shinkansen.proxy.rlwy.net',
  database: 'railway',
  password: 'xaZYzwJSEnXtOrbEdlbsxwqBeXSouEMP',
  port: 21790,

});

// Load the schema.sql file
const schemaFilePath = path.join(__dirname, 'database-schema.sql');
const schemaSql = fs.readFileSync(schemaFilePath, 'utf8');

// Migrate database
async function migrateDatabase() {
  try {
    console.log('Starting database migration...');
    
    // Execute schema.sql to create tables
    await pool.query(schemaSql);
    console.log('Successfully created database schema.');
    
    // Populate with sample data
    await populateDatabase();
    
    console.log('Database migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Database migration failed:', error);
    process.exit(1);
  }
}

// Populate database with sample data
async function populateDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Populating database with sample data...');
    await client.query('BEGIN');
    
    // Insert sample users
    const users = [
      { name: 'Admin User', email: 'admin@example.com', password: '$2a$10$EsQ.Z6WYGhQVjcOK99y2JOKMNjYi6CLpGP8CNHpiCBEXp5uoau.Vy', role: 'admin' }, // password: admin123
      { name: 'Property Owner', email: 'owner@example.com', password: '$2a$10$XoGBnboC5NsZ0jLhjCAhPuDsq.3v8i9yRJPf.QfR1AbAA4P3aBYV2', role: 'owner' }, // password: owner123
      { name: 'John Client', email: 'john@example.com', password: '$2a$10$EsQ.Z6WYGhQVjcOK99y2JOKMNjYi6CLpGP8CNHpiCBEXp5uoau.Vy', role: 'client' }, // password: client123
      { name: 'Jane Client', email: 'jane@example.com', password: '$2a$10$EsQ.Z6WYGhQVjcOK99y2JOKMNjYi6CLpGP8CNHpiCBEXp5uoau.Vy', role: 'client' }, // password: client123
    ];
    
    for (const user of users) {
      await client.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
        [user.name, user.email, user.password, user.role]
      );
    }
    console.log('Users added successfully');
    
    // Insert sample properties
    const properties = [
      {
        title: 'Modern Downtown Apartment',
        description: 'Beautiful modern apartment in the heart of downtown. Features include granite countertops, stainless steel appliances, and an amazing city view.',
        address: '123 Main Street, Unit 4B',
        city: 'New York',
        state: 'NY',
        zip_code: '10001',
        price: 2500.00,
        bedrooms: 2,
        bathrooms: 2.0,
        square_feet: 1000,
        property_type: 'apartment',
        status: 'available',
        owner_id: 2,
        image_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'
      },
      {
        title: 'Luxury Penthouse Suite',
        description: 'Stunning penthouse with panoramic views of the city skyline. Features include a private terrace, chef\'s kitchen, and floor-to-ceiling windows.',
        address: '500 Park Avenue, Penthouse A',
        city: 'New York',
        state: 'NY',
        zip_code: '10022',
        price: 5500.00,
        bedrooms: 3,
        bathrooms: 3.5,
        square_feet: 2500,
        property_type: 'penthouse',
        status: 'available',
        owner_id: 2,
        image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750'
      },
      {
        title: 'Cozy Studio Apartment',
        description: 'Perfect for young professionals or students. This studio apartment features efficient use of space, modern amenities, and a convenient location.',
        address: '789 University Ave, Unit 2C',
        city: 'Boston',
        state: 'MA',
        zip_code: '02115',
        price: 1200.00,
        bedrooms: 0,
        bathrooms: 1.0,
        square_feet: 500,
        property_type: 'studio',
        status: 'available',
        owner_id: 2,
        image_url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85'
      },
      {
        title: 'Suburban Family Home',
        description: 'Spacious family home in a quiet suburban neighborhood. Features include a large backyard, finished basement, and attached two-car garage.',
        address: '456 Oak Street',
        city: 'Chicago',
        state: 'IL',
        zip_code: '60007',
        price: 3200.00,
        bedrooms: 4,
        bathrooms: 2.5,
        square_feet: 2200,
        property_type: 'house',
        status: 'available',
        owner_id: 2,
        image_url: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233'
      },
      {
        title: 'Beach Front Condo',
        description: 'Wake up to the sound of waves in this beautiful beachfront condo. Features include private beach access, updated kitchen, and a spacious balcony.',
        address: '101 Ocean Drive, Unit 7A',
        city: 'Miami',
        state: 'FL',
        zip_code: '33139',
        price: 3800.00,
        bedrooms: 2,
        bathrooms: 2.0,
        square_feet: 1200,
        property_type: 'condo',
        status: 'available',
        owner_id: 2,
        image_url: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2'
      }
    ];
    
    for (const property of properties) {
      await client.query(
        `INSERT INTO properties 
         (title, description, address, city, state, zip_code, price, 
          bedrooms, bathrooms, square_feet, property_type, status, owner_id, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          property.title, property.description, property.address, property.city, 
          property.state, property.zip_code, property.price, property.bedrooms, 
          property.bathrooms, property.square_feet, property.property_type, 
          property.status, property.owner_id, property.image_url
        ]
      );
    }
    console.log('Properties added successfully');
    
    // Insert sample bookings
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const bookings = [
      {
        property_id: 1,
        client_id: 3,
        booking_date: formatDate(tomorrow),
        start_time: '10:00:00',
        end_time: '11:00:00',
        status: 'confirmed',
        notes: 'Looking forward to seeing the apartment!'
      },
      {
        property_id: 2,
        client_id: 4,
        booking_date: formatDate(nextWeek),
        start_time: '14:00:00',
        end_time: '15:00:00',
        status: 'pending',
        notes: 'Interested in a long-term lease.'
      },
      {
        property_id: 3,
        client_id: 3,
        booking_date: formatDate(nextWeek),
        start_time: '11:00:00',
        end_time: '12:00:00',
        status: 'confirmed',
        notes: 'Looking for a studio close to university.'
      }
    ];
    
    for (const booking of bookings) {
      await client.query(
        `INSERT INTO bookings 
         (property_id, client_id, booking_date, start_time, end_time, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          booking.property_id, booking.client_id, booking.booking_date, 
          booking.start_time, booking.end_time, booking.status, booking.notes
        ]
      );
    }
    console.log('Bookings added successfully');
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Helper function to format date for SQL
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Run the migration
migrateDatabase();