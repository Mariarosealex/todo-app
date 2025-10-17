const mongoose = require("mongoose");

// Connect to todoapp database
mongoose.connect("mongodb://localhost:27017/todoapp")
  .then(async () => {
    console.log("Connected to todoapp database");
    
    try {
      const db = mongoose.connection.db;
      
      // Drop the username index if it exists
      try {
        await db.collection('users').dropIndex('username_1');
        console.log("✅ Dropped username index");
      } catch (error) {
        console.log("Username index doesn't exist or already dropped");
      }
      
      // Show current indexes
      const indexes = await db.collection('users').indexes();
      console.log("Current indexes:", indexes);
      
      // Show users count
      const userCount = await db.collection('users').countDocuments();
      console.log(`Users in database: ${userCount}`);
      
      process.exit(0);
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("Connection error:", error);
    process.exit(1);
  });