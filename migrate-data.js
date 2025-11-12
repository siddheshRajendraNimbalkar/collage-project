const { createClient } = require('redis');

async function migrateData() {
  const redis = createClient({ 
    url: 'redis://localhost:6379',
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 50, 500)
    }
  });
  
  try {
    await redis.connect();
    console.log('✅ Connected to Redis');

    // Sample autocomplete data
    const sampleData = [
      { name: 'APPLE', productId: 'prod_001' },
      { name: 'BANANA', productId: 'prod_002' },
      { name: 'ORANGE', productId: 'prod_003' },
      { name: 'GRAPE', productId: 'prod_004' },
      { name: 'STRAWBERRY', productId: 'prod_005' },
    ];

    // Clear existing data
    const keys = await redis.keys('autocomplete*');
    if (keys.length > 0) {
      await redis.del(keys);
    }
    console.log('🧹 Cleared existing autocomplete data');

    // Add autocomplete entries
    for (const item of sampleData) {
      await redis.zAdd('autocomplete', { score: 0, value: item.name + '*' });
      await redis.zAdd(`autocomplete:${item.name}`, { score: 0, value: item.productId });
      console.log(`📝 Added: ${item.name} -> ${item.productId}`);
    }

    // Verify data
    const count = await redis.zCard('autocomplete');
    console.log(`✅ Migration completed! ${count} items in autocomplete`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await redis.quit();
  }
}

migrateData();