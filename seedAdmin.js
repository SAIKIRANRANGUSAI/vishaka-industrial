const bcrypt = require("bcrypt");
const db = require("./config/db"); // your DB connection

(async () => {
  try {
    const username = "admin";
    const plainPassword = "123456";

    // Hash password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Insert into DB
    await db.execute(
      "INSERT INTO admin (username, password) VALUES (?, ?)",
      [username, hashedPassword]
    );

    console.log("✅ Admin user created successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating admin:", err);
    process.exit(1);
  }
})();
