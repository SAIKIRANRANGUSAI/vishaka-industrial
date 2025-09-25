const express = require("express");
const router = express.Router();
const db = require("../config/db");
const axios = require("axios");
require("dotenv").config(); // Make sure to install and require this package

// Home page
// Dynamic Home Page Route
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // current page
    const limit = 4; // 4 services per page
    const offset = (page - 1) * limit;

    // Fetch home page banners
    const [rows] = await db.execute("SELECT * FROM home_page_banners LIMIT 1");
    const data = rows[0] || {};

    // Fetch total services count
    const [countResult] = await db.execute("SELECT COUNT(*) as total FROM services");
    const totalServices = countResult[0].total;
    const totalPages = Math.ceil(totalServices / limit);

    // Fetch paginated services (numbers directly in query)
    const [services] = await db.execute(
      `SELECT * FROM services ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`
    );

    res.render("index", {
      title: "Home",
      hero1: data.hero1,
      hero2: data.hero2,
      hero3: data.hero3,
      offer_title: data.offer_title,
      offer_description: data.offer_description,
      services,
      currentPage: page,
      totalPages
    });
  } catch (err) {
    console.error("❌ GET / error:", err);
    res.status(500).send("Server Error");
  }
});

router.get("/service-details", async (req, res) => {
  try {
    const [allServices] = await db.execute("SELECT * FROM services ORDER BY id ASC");

    res.render("service-details", {
      title: "Our Services",
      services: allServices,   // pass all services
      activeSlug: null         // no specific service to scroll/highlight
    });
  } catch (err) {
    console.error("❌ GET /service-details error:", err);
    res.status(500).send("Server Error");
  }
});
router.get("/service-details/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;

    // Fetch all services (to list on page)
    const [allServices] = await db.execute("SELECT * FROM services ORDER BY id ASC");

    // Fetch the clicked one
    const [serviceRows] = await db.execute("SELECT * FROM services WHERE slug = ?", [slug]);
    if (!serviceRows.length) return res.status(404).send("Service not found");

    res.render("service-details", {
      title: serviceRows[0].title,
      services: allServices,
      activeSlug: slug, // so we know which one to scroll/highlight
    });
  } catch (err) {
    console.error("❌ GET /service-details/:slug error:", err);
    res.status(500).send("Server Error");
  }
});
router.get("/services-pagination", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const offset = (page - 1) * limit;

    const [services] = await db.execute(
      `SELECT * FROM services ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`
    );

    const [countResult] = await db.execute("SELECT COUNT(*) as total FROM services");
    const totalServices = countResult[0].total;
    const totalPages = Math.ceil(totalServices / limit);

    res.render("partials/services-pagination", { services, currentPage: page, totalPages }, (err, html) => {
      if (err) return res.status(500).send("Error rendering services");
      res.send(html);
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});


router.get("/about", (req, res) => res.render("about", { title: "About" }));
router.get("/gallery", (req, res) => res.render("gallery", { title: "Gallery" }));
// Pass the site key to the EJS template
router.get("/clients", (req, res) => res.render("clients", { title: "Clients" }));


router.get("/contact-us", (req, res) => res.render("contact-us", { 
  title: "Contact Us", 
  sitekey: process.env.RECAPTCHA_SITE_KEY 
}));

// Contact form submission
// ... (rest of the code)

// Contact form submission
router.post("/contact-submit", async (req, res) => {
  try {
    const { name, email, number, subject, otherSubject, message, "g-recaptcha-response": token } = req.body;
    const finalSubject = subject === "Other" ? otherSubject?.trim() : subject?.trim();

    // ... (rest of your validation and reCAPTCHA code)

    // Save to database
    // Corrected SQL query to match the provided data
    const sql = `INSERT INTO contact_submissions 
                 (name, email, phone, subject, message, created_at) 
                 VALUES (?, ?, ?, ?, ?, NOW())`;
    
    await db.query(sql, [name.trim(), email.trim(), number.trim(), finalSubject, message.trim()]);

    res.json({ success: true, message: "Form submitted successfully!" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error, try again later." });
  }
});

module.exports = router;
