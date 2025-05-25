const { Pool } = require('pg');

const pool = new Pool({
  user: 'umhre9bpwaa0kdlwaffy',
  host: 'brcn63rrvzidwfsxpiiz-postgresql.services.clever-cloud.com',
  database: 'brcn63rrvzidwfsxpiiz',
  password: 'BQntnQejUZvCo4v3mKbKeLpzuVF142',
  port: 50013
});

const seedProperties = async () => {
  const properties = [
    {
      name: 'Skyline Apartments',
      location: 'Mumbai, India',
      price: 12000000,
      size: '1250 sqft',
      type: 'Apartment',
      description: 'Luxurious 2BHK apartment with sea view',
      image: 'https://images.unsplash.com/photo-1598928506311-c55ded81f55e'
    },
    {
      name: 'Palm Meadows Villa',
      location: 'Bangalore, India',
      price: 30000000,
      size: '3000 sqft',
      type: 'Villa',
      description: 'Gated villa with garden and private pool',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c'
    },
    {
      name: 'Maple Residency',
      location: 'Pune, India',
      price: 9500000,
      size: '1100 sqft',
      type: 'Apartment',
      description: 'Affordable 2BHK with balcony and amenities',
      image: 'https://images.unsplash.com/photo-1572120360610-d971b9b78857'
    },
    {
      name: 'Green Acres Plot',
      location: 'Hyderabad, India',
      price: 5500000,
      size: '2400 sqft',
      type: 'Land',
      description: 'Open plot in developing area, great for investment',
      image: 'https://images.unsplash.com/photo-1501183638710-841dd1904471'
    },
    {
      name: 'Elite Towers Penthouse',
      location: 'Delhi, India',
      price: 50000000,
      size: '3500 sqft',
      type: 'Penthouse',
      description: 'Ultra-luxury penthouse with rooftop and smart features',
      image: 'https://images.unsplash.com/photo-1622000960741-4b9c1d2a8e0d'
    }
  ];

  try {
    // Create the table if it doesn't exist (with image field)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        price INTEGER NOT NULL,
        size TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        image TEXT
      );
    `);

    // Insert mock data
    for (const property of properties) {
      await pool.query(
        `INSERT INTO properties (name, location, price, size, type, description, image)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          property.name,
          property.location,
          property.price,
          property.size,
          property.type,
          property.description,
          property.image
        ]
      );
    }

    console.log('✅ Properties table created and seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding properties:', error);
  } finally {
    await pool.end();
  }
};

seedProperties();
