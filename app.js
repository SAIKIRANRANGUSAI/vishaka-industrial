require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");

// Routes
const frontendRoutes = require("./routes/frontend");
const adminRoutes = require("./routes/admin");

const app = express();

// -------------------- MIDDLEWARE -------------------- //

// Security & session
app.use(session({
  secret: process.env.SESSION_SECRET || 'yoursecretkey',
  resave: false,
  saveUninitialized: true
}));
app.use(flash());

// Parse request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Cookies
app.use(cookieParser());

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// View engine
app.set("view engine", "ejs");
app.set("views", [
  path.join(__dirname, "views/frontend"), // frontend views
  path.join(__dirname, "admin/views")     // admin views
]);



// -------------------- ROUTES -------------------- //
app.use("/", frontendRoutes);       // Public pages
//app.use("/admin", adminRoutes);     // Admin panel

// -------------------- START SERVER -------------------- //
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

module.exports = app;
