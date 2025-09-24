const express = require("express");
const router = express.Router();
const db = require("../config/db"); // for future DB queries

// Home page
router.get("/", async (req, res) => {
  res.render("index", { title: "Home" });
});

// Service details
router.get("/service-details", async (req, res) => {
  res.render("service-details", { title: "Service Details" });
});

router.get("/about", async (req, res) => {
  res.render("about", { title: "About" });
});

// Gallery
router.get("/gallery", async (req, res) => {
  res.render("gallery", { title: "Gallery" });
});

// Contact us
router.get("/contact-us", async (req, res) => {
  res.render("contact-us", { title: "Contact Us" }); // fixed typo
});

// Clients
router.get("/clients", async (req, res) => {
  res.render("clients", { title: "Clients" });
});

module.exports = router;
