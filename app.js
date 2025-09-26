require("dotenv").config();
const express = require("express");
const helmet = require('helmet');
const db = require('./config/db');
const path = require("path");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const bcrypt = require('bcrypt');



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

        imgSrc: [
          "'self'",
          "data:",
          "https://res.cloudinary.com",
          "https://www.google.com",       // ✅ Google (maps, captcha images)
          "https://maps.googleapis.com",  // ✅ Google Maps
          "https://maps.gstatic.com"      // ✅ Google Maps static assets
        ],

        scriptSrc: [
          "'self'",
          "https://cdn.tiny.cloud",
          "https://cdn.jsdelivr.net",
          "https://www.google.com/recaptcha/", // ✅ reCAPTCHA
          "https://www.gstatic.com/recaptcha/", // ✅ reCAPTCHA
          "'unsafe-inline'"
        ],

        styleSrc: [
          "'self'",
          "https://cdn.tiny.cloud",
          "https://cdnjs.cloudflare.com",    // ✅ Font Awesome
          "https://cdn.jsdelivr.net",        // ✅ Bootstrap
          "https://fonts.googleapis.com",    // ✅ Google Fonts
          "'unsafe-inline'"
        ],

        connectSrc: [
          "'self'",
          "https://www.google.com",   // ✅ for captcha + maps API
          "https://www.gstatic.com"
        ],

        fontSrc: [
          "'self'",
          "https://cdnjs.cloudflare.com",  // ✅ FA fonts
          "https://cdn.jsdelivr.net",
          "https://fonts.gstatic.com",     // ✅ Google Fonts
          "data:"
        ],

        frameSrc: [
          "'self'",
          "https://www.google.com",    // ✅ reCAPTCHA + Maps iframes
          "https://www.gstatic.com"
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
// In your main app file
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

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

// Example middleware to fetch SEO for current page
app.use(async (req, res, next) => {
  try {
    let slug = req.path === '/' ? 'home' : req.path.replace('/', '');
    const [seoRows] = await db.execute("SELECT * FROM seo_settings WHERE page_slug = ?", [slug]);

    res.locals.requestUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`; // pass full URL

    if (seoRows.length > 0) {
      res.locals.seo = seoRows[0];  // make it available in EJS
    } else {
      res.locals.seo = {
        title: "Default Site Title",
        description: "Default description here",
        keywords: "default, keywords",
        og_title: "Default OG Title",
        og_description: "Default OG Description",
        og_image: "/images/default-og.jpg",
        twitter_title: "Default Twitter Title",
        twitter_description: "Default Twitter Description",
        twitter_image: "/images/default-og.jpg"
      };
    }
    next();
  } catch (err) {
    console.error(err);
    next();
  }
});


app.use(async (req, res, next) => {
  try {
    const [rows] = await db.execute("SELECT * FROM site_settings LIMIT 1");
    res.locals.siteSettings = rows[0] || {};
    next();
  } catch (err) {
    console.error("❌ Error fetching site settings:", err);
    res.locals.siteSettings = {};
    next();
  }
});

// Universal middleware to make services available in all views
app.use(async (req, res, next) => {
  try {
    const [allServices] = await db.execute("SELECT * FROM services ORDER BY id ASC");
    res.locals.footerServices = allServices; // now available in all EJS templates
    next();
  } catch (err) {
    console.error("❌ Error fetching services for footer:", err);
    res.locals.footerServices = []; // fallback empty array
    next();
  }
});

// -------------------- ROUTES -------------------- //
app.use("/", frontendRoutes);       // Public pages
app.use("/admin", adminRoutes);     // Admin panel

// -------------------- START SERVER -------------------- //
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

module.exports = app;
