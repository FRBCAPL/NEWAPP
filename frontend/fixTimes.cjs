const { MongoClient } = require('mongodb');

// Replace with your actual MongoDB Atlas connection string
const uri = 'mongodb+srv://sslampro:Sstop4slam@cluster0.ui3qqqc.mongodb.net/';
const dbName = 'pool-league';
const collectionName = 'matches';

function to24Hour(time12h) {
  if (!time12h) return "";
  // Already in 24-hour format?
  if (/^\d{2}:\d{2}$/.test(time12h)) return time12h;
  const [time, modifier] = time12h.split(' ');
  if (!modifier) return time12h; // Already 24h or malformed
  let [hours, minutes] = time.split(':');
  if (hours === '12') hours = '00';
  if (modifier === 'PM' && hours !== '00') hours = String(parseInt(hours, 10) + 12);
  return `${hours.padStart(2, '0')}:${minutes}`;
}

async function fixTimes() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const matches = db.collection(collectionName);

    const cursor = matches.find({});
    let updates = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const oldTime = doc.time;
      if (!oldTime) continue;
      const newTime = to24Hour(oldTime);
      if (newTime !== oldTime) {
        await matches.updateOne(
          { _id: doc._id },
          { $set: { time: newTime } }
        );
        console.log(`Updated _id=${doc._id}: "${oldTime}" -> "${newTime}"`);
        updates++;
      }
    }

    console.log(`Done! Updated ${updates} document(s).`);
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

fixTimes();
