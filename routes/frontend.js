const express = require("express");
const router = express.Router();
const db = require("../config/db");
const axios = require("axios");
require("dotenv").config(); // Make sure to install and require this package
// const sanitizeHtml = require('sanitize-html');
const fetch = require("node-fetch"); // ensure this is installed: npm i node-fetch
const sanitizeHtml = require("sanitize-html");

// Home page
// Dynamic Home Page Route
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // current page
    const limit = 4; // 4 services per page
    const offset = (page - 1) * limit;

    const galleryPage = parseInt(req.query.galleryPage) || 1;
    const galleryLimit = 6; // Show 6 images per page (2 rows of 3)
    const galleryOffset = (galleryPage - 1) * galleryLimit;

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
    const [aboutRows] = await db.execute("SELECT * FROM about_us ORDER BY id DESC LIMIT 1");
    const about = aboutRows[0] || {};
    const [whoRows] = await db.execute("SELECT * FROM who_we_are_section LIMIT 1");
    const whoData = whoRows[0] || {};

    // Clients pagination
    // Inside your "/" route
    // Clients pagination and fetch


    const [clients] = await db.execute("SELECT * FROM clients ORDER BY id DESC");

    const [galleryCountResult] = await db.execute("SELECT COUNT(*) as total FROM gallery");
    const totalGalleryImages = galleryCountResult[0].total;
    const galleryTotalPages = Math.ceil(totalGalleryImages / galleryLimit);

    const [galleryImages] = await db.execute(
      `SELECT * FROM gallery ORDER BY created_at DESC LIMIT ${galleryLimit} OFFSET ${galleryOffset}`
    );

     const [sectionRows] = await db.execute("SELECT * FROM testimonial_section LIMIT 1");
      const sectionData = sectionRows.length > 0 ? sectionRows[0] : {};

        // Fetch testimonial entries
      const [testimonialRows] = await db.execute("SELECT * FROM testimonial_entries ORDER BY created_at DESC");


    res.render("index", {
      title: "Home",
      hero1: data.hero1,
      hero2: data.hero2,
      hero3: data.hero3,
      offer_title: data.offer_title,
      offer_description: data.offer_description,
      services,
      currentPage: page,
      totalPages,
      about,
      clients: clients || [], // Dynamic clients array
      clientCurrentPage: 1,
      clientTotalPages: 1,
      galleryImages: galleryImages || [], // New gallery images array
      galleryCurrentPage: galleryPage,
      galleryTotalPages: galleryTotalPages,
      sectionData,
      testimonials: testimonialRows,
      whoData

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


router.get("/about", async (req, res) => {
  try {
    // Fetch the about_us record (assuming only 1 row)
    const [rows] = await db.execute("SELECT * FROM about_us ORDER BY id DESC LIMIT 1");

    const about = rows[0] || {}; // fallback if table is empty
    const [detailsRows] = await db.execute("SELECT * FROM about_page_details ORDER BY id DESC LIMIT 1");
    const aboutDetails = detailsRows[0] || {}; // fallback if table is empty

    res.render("about", {
      title: "About",
      about, // pass dynamic content to EJS
      aboutDetails,
    });
  } catch (err) {
    console.error(err);
    res.render("about", { title: "About", about: {} });
  }
});

router.get("/gallery", async (req, res) => {
  try {
    const [images] = await db.execute("SELECT * FROM gallery ORDER BY created_at DESC");
    res.render("gallery", { title: "Gallery", images });
  } catch (err) {
    console.error("Failed to fetch gallery images:", err);
    res.render("gallery", { title: "Gallery", images: [] });
  }
});
// Pass the site key to the EJS template
router.get("/clients", async (req, res) => {
  try {
    // Fetch all clients from DB
    const [clients] = await db.execute("SELECT * FROM clients ORDER BY id DESC");

    res.render("clients", {
      title: "Clients",
      clients: clients || []
    });
  } catch (err) {
    console.error(err);
    res.render("clients", {
      title: "Clients",
      clients: []
    });
  }
});

// GET contact page
router.get("/contact-us", (req, res) => {
  res.render("contact-us", {
    title: "Contact Us",
    sitekey: '6LcNJ9YrAAAAAOkmAwF1M3-4XqUzOvFqdRtajjfO'
  });
});

// POST form submit
router.post("/contact-submit", async (req, res) => {
  try {
    const { name='', email='', number='', subject='', otherSubject='', message='' } = req.body;
    const token = req.body["g-recaptcha-response"] || '';

    if (!name || !email || !number || (!subject && !otherSubject) || !message || !token) {
      return res.status(400).json({ success: false, message: "Please complete all required fields." });
    }

    // reCAPTCHA v2 secret
    const secret = '6LcNJ9YrAAAAABkXTOpApjA20Edzg84W0GiNw0jV';

    // Verify token
    const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token })
    });
    const verifyJson = await verifyRes.json();
    console.log("reCAPTCHA verify response:", verifyJson);

    if (!verifyJson.success) {
      return res.status(400).json({
        success: false,
        message: "reCAPTCHA verification failed. Please try again.",
        errors: verifyJson['error-codes'] || []
      });
    }

    const finalSubject = (subject === 'Other' ? (otherSubject || '').trim() : subject.trim()) || 'General Inquiry';

    // Sanitize all fields
    const cleanName = sanitizeHtml(name.trim(), { allowedTags: [], allowedAttributes: {} });
    const cleanEmail = sanitizeHtml(email.trim(), { allowedTags: [], allowedAttributes: {} });
    const cleanNumber = sanitizeHtml(number.trim(), { allowedTags: [], allowedAttributes: {} });
    const cleanSubject = sanitizeHtml(finalSubject, { allowedTags: [], allowedAttributes: {} });
    let cleanMessage = sanitizeHtml(message.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi,''), { allowedTags: [], allowedAttributes: {} });

    // Redact SQL/code keywords
    const patterns = [/db\.execute/gi,/db\.query/gi,/await\s+db/gi,/DROP\s+TABLE/gi,/ALTER\s+TABLE/gi,/INSERT\s+INTO/gi,/DELETE\s+FROM/gi,/`/g];
    patterns.forEach(rx => cleanMessage = cleanMessage.replace(rx,'[redacted]'));

    const MAX_LEN = 2000;
    if(cleanMessage.length>MAX_LEN) cleanMessage = cleanMessage.slice(0,MAX_LEN)+'...[truncated]';

    // Insert into DB
    await db.execute(
      `INSERT INTO contact_submissions (name,email,phone,subject,message,created_at) VALUES (?,?,?,?,?,NOW())`,
      [cleanName, cleanEmail, cleanNumber, cleanSubject, cleanMessage]
    );

    return res.json({ success: true, message: "Thank you — your message has been received. We'll get back to you soon." });
  } catch (err) {
    console.error("Contact submit error:", err);
    return res.status(500).json({ success: false, message: "Server error, please try again later." });
  }
});

module.exports = router;
