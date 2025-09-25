require("dotenv").config();
const express = require("express");
const helmet = require('helmet');

const path = require("path");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");



// Routes
const frontendRoutes = require("./routes/frontend");
const adminRoutes = require("./routes/admin");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.js (add near top)
// const helmet = require('helmet');
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        scriptSrc: ["'self'", "https://cdn.tiny.cloud", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
        styleSrc: [
          "'self'",
          "https://cdn.tiny.cloud",
          "https://cdnjs.cloudflare.com",   // ✅ allow Font Awesome
          "https://cdn.jsdelivr.net",       // ✅ allow Bootstrap CSS if used
          "'unsafe-inline'"
        ],
        connectSrc: ["'self'"],
        fontSrc: [
          "'self'",
          "https://cdnjs.cloudflare.com",   // ✅ allow FA fonts
          "https://cdn.jsdelivr.net",
          "data:"
        ]
      },
    },
  })
);


// parse JSON and urlencoded bodies
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// -------------------- VIEW ENGINE -------------------- //
// -------------------- VIEW ENGINE -------------------- //
app.set("view engine", "ejs");
app.set("views", [
  path.join(__dirname, "views/frontend"),
  path.join(__dirname, "views/admin")
]);


// -------------------- MIDDLEWARE -------------------- //
app.use(session({
  secret: process.env.SESSION_SECRET || 'yoursecretkey',
  resave: false,
  saveUninitialized: true
}));
app.use(flash());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// -------------------- ROUTES -------------------- //
app.use("/", frontendRoutes);       // Public pages
app.use("/admin", adminRoutes);     // Admin panel

// -------------------- START SERVER -------------------- //
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

module.exports = app;
