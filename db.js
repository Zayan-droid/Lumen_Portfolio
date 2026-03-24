/* ═══════════════════════════════════════════════════════════
   Lumin — MongoDB Connection Module
   ═══════════════════════════════════════════════════════════ */

const { MongoClient } = require('mongodb');

let client = null;
let db = null;

/**
 * Connect to MongoDB and return the database instance.
 * Reuses the existing connection if already connected.
 */
async function connectDB() {
    if (db) return db;

    const uri = process.env.MONGODB_URI;

    if (!uri) {
        console.warn('⚠️  MONGODB_URI not set — falling back to local JSON file storage.');
        return null;
    }

    try {
        client = new MongoClient(uri);
        await client.connect();
        db = client.db(); // uses the database name from the URI
        console.log('✅ Connected to MongoDB');

        // Create indexes for frequently queried fields
        const collection = db.collection('waitlist');
        await collection.createIndex({ contactEmail: 1 }, { unique: true });
        await collection.createIndex({ status: 1 });
        await collection.createIndex({ submittedAt: -1 });

        return db;
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        return null;
    }
}

/**
 * Get the waitlist collection.
 * Returns null if DB is not connected.
 */
function getWaitlistCollection() {
    if (!db) return null;
    return db.collection('waitlist');
}

/**
 * Gracefully close the MongoDB connection.
 */
async function closeDB() {
    if (client) {
        await client.close();
        client = null;
        db = null;
        console.log('MongoDB connection closed.');
    }
}

module.exports = { connectDB, getWaitlistCollection, closeDB };
