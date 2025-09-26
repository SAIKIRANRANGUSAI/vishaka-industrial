
const express = require("express");
const router = express.Router();
const authController = require("../controllers/controllers");
const db = require("../config/db");
const multer = require("multer");
const { uploadToCloudinary, deleteFromCloudinary } = require("../helpers/cloudinaryUpload");
const bcrypt = require('bcrypt');

// Multer temp storage for uploads
// const upload = multer({ dest: "uploads/" });
// const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

// -------- Login & Logout Routes --------
router.get("/login", (req, res) => {
  res.render("login", { error: null });
});

router.post("/login", authController.postLogin);
router.get("/logout", authController.logout);

// Protect all admin routes after this
router.use(authController.isAuthenticated);

// -------- Dashboard Route --------
router.get("/dashboard", async (req, res) => {
  try {
    const contactPerPage = 10;
    const contactCurrentPage = parseInt(req.query.contactPage, 10) || 1;
    const offset = (contactCurrentPage - 1) * contactPerPage;

    // Total messages count
    const [totalRows] = await db.query("SELECT COUNT(*) AS totalMessages FROM contact_submissions");
    const contactStats = { totalMessages: totalRows[0].totalMessages };

    // Fetch paginated messages
    const [contactMessages] = await db.query(
      "SELECT * FROM contact_submissions ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [contactPerPage, offset]
    );

    const contactTotalPages = Math.ceil(contactStats.totalMessages / contactPerPage);

    // Placeholder alumni stats
    const alumniStats = { totalAlumni: 0 };
    const alumniCurrentPage = parseInt(req.query.alumniPage, 10) || 1;

    res.render("admin_dashboard", {
      user: req.user,
      contactMessages,
      contactStats,
      contactCurrentPage,
      contactTotalPages,
      contactPerPage,
      alumniStats,
      alumniCurrentPage,
    });
  } catch (err) {
    console.error("❌ Dashboard error:", err);
    res.status(500).send("Server error");
  }
});

// -------- Contact Message Delete --------
router.delete("/contact/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await db.query("DELETE FROM contact_submissions WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Delete contact error:", err);
    res.json({ success: false });
  }
});

// -------- Admin Home Page Routes --------

// GET Home Page Banner
// GET Home Page
router.get("/home", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM home_page_banners LIMIT 1");
    const data = rows[0] || { hero1: null, hero2: null, hero3: null, offer_title: '', offer_description: '' };
    res.render("admin_home", { data, successMessage: null });
  } catch (err) {
    console.error("❌ GET home error:", err);
    res.status(500).send("Server Error");
  }
});

// POST Update Home Page Banner
router.post(
  "/home",
  upload.fields([
    { name: "hero1" },
    { name: "hero2" },
    { name: "hero3" },
  ]),
  async (req, res) => {
    try {
      const files = req.files;
      let { offer_title, offer_description } = req.body;

      // Replace empty strings with null for DB safety
      offer_title = offer_title || null;
      offer_description = offer_description || null;

      const [rows] = await db.execute("SELECT * FROM home_page_banners LIMIT 1");
      const data = rows[0] || { hero1: null, hero2: null, hero3: null };

      // Helper: Upload new image or keep existing
      const processImage = async (file, oldUrl, folder = "home_banners") => {
        if (!file) return oldUrl || null;

        try {
          const uploaded = await uploadToCloudinary(file.buffer, folder);

          // Delete old image from Cloudinary if exists
          if (oldUrl) {
            // Extract public_id from URL
            const segments = oldUrl.split("/");
            const fileName = segments.pop().split(".")[0]; 
            await deleteFromCloudinary(`${folder}/${fileName}`);
          }

          return uploaded.url;
        } catch (error) {
          console.error("❌ Image upload error:", error);
          return oldUrl || null;
        }
      };

      // Process all hero images
      const hero1 = await processImage(files.hero1?.[0], data.hero1);
      const hero2 = await processImage(files.hero2?.[0], data.hero2);
      const hero3 = await processImage(files.hero3?.[0], data.hero3);

      // Update or insert
      if (data.id) {
        await db.execute(
          "UPDATE home_page_banners SET hero1=?, hero2=?, hero3=?, offer_title=?, offer_description=? WHERE id=?",
          [hero1, hero2, hero3, offer_title, offer_description, data.id]
        );
      } else {
        await db.execute(
          "INSERT INTO home_page_banners (hero1, hero2, hero3, offer_title, offer_description) VALUES (?, ?, ?, ?, ?)",
          [hero1, hero2, hero3, offer_title, offer_description]
        );
      }

      // Fetch updated data
      const [updatedRows] = await db.execute("SELECT * FROM home_page_banners LIMIT 1");
      const updatedData = updatedRows[0] || { hero1, hero2, hero3, offer_title, offer_description };

      res.render("admin_home", {
        data: updatedData,
        successMessage: "Home page updated successfully!",
      });
    } catch (err) {
      console.error("❌ POST home error:", err);
      res.status(500).send("Server Error");
    }
  }
);

router.get("/services", async (req, res) => {
    try {
        const [services] = await db.execute("SELECT * FROM services ORDER BY created_at DESC");
        res.render("admin_services", { services, successMessage: null });
    } catch (err) {
        console.error("❌ GET /services error:", err);
        res.status(500).send("Server Error");
    }
});

// POST Add New Service
router.post("/services", upload.single("image"), async (req, res) => {
    try {
        const { title, description, slug } = req.body;
        let image_url = "";

        if (req.file) {
            const uploaded = await uploadToCloudinary(req.file.buffer, "services");
            image_url = uploaded.url;
        }

        await db.execute(
            "INSERT INTO services (title, description, image_url, slug) VALUES (?, ?, ?, ?)",
            [title, description, image_url, slug]
        );

        const [services] = await db.execute("SELECT * FROM services ORDER BY created_at DESC");
        res.render("admin_services", { services, successMessage: "Service added successfully!" });
    } catch (err) {
        console.error("❌ POST /services error:", err);
        res.status(500).send("Server Error");
    }
});


// POST Edit Service
router.post("/services/:id/edit", upload.single("image"), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, slug } = req.body;

        // Get existing service
        const [rows] = await db.execute("SELECT * FROM services WHERE id = ?", [id]);
        const service = rows[0];

        let image_url = service.image_url;

        // If new image uploaded
        if (req.file) {
            const uploaded = await uploadToCloudinary(req.file.buffer, "services");
            image_url = uploaded.url;

            // Delete old image
            if (service.image_url) {
                const segments = service.image_url.split("/");
                const fileName = segments.pop().split(".")[0];
                await deleteFromCloudinary(`services/${fileName}`);
            }
        }

        await db.execute(
            "UPDATE services SET title=?, description=?, image_url=?, slug=? WHERE id=?",
            [title, description, image_url, slug, id]
        );

        const [services] = await db.execute("SELECT * FROM services ORDER BY created_at DESC");
        res.render("admin_services", { services, successMessage: "Service updated successfully!" });
    } catch (err) {
        console.error("❌ POST /services/:id/edit error:", err);
        res.status(500).send("Server Error");
    }
});

// DELETE Service
router.post("/services/:id/delete", async (req, res) => {
    try {
        const { id } = req.params;

        // Delete image from Cloudinary
        const [rows] = await db.execute("SELECT * FROM services WHERE id = ?", [id]);
        const service = rows[0];
        if (service.image_url) {
            const segments = service.image_url.split("/");
            const fileName = segments.pop().split(".")[0];
            await deleteFromCloudinary(`services/${fileName}`);
        }

        await db.execute("DELETE FROM services WHERE id = ?", [id]);
        const [services] = await db.execute("SELECT * FROM services ORDER BY created_at DESC");
        res.render("admin_services", { services, successMessage: "Service deleted successfully!" });
    } catch (err) {
        console.error("❌ POST /services/:id/delete error:", err);
        res.status(500).send("Server Error");
    }
});
// GET About Us page
// GET About Us Page
router.get("/about-us", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM about_us ORDER BY id DESC LIMIT 1");
    const about = rows[0] || {};

    const [aboutRows] = await db.execute("SELECT * FROM about_page_details ORDER BY id DESC LIMIT 1");
    const abouts = aboutRows[0] || {};

    res.render("admin_about-us", { about, abouts, successMessage: '' });
  } catch (err) {
    console.error("❌ GET /about-us Error:", err);
    res.status(500).send("Server Error");
  }
});

// POST Update Main About Us Content (Table 1)
router.post("/about-us", upload.fields([{ name: "image1" }, { name: "image2" }]), async (req, res) => {
  try {
    const { heading, description } = req.body;
    const files = req.files;

    const [rows] = await db.execute("SELECT * FROM about_us ORDER BY id DESC LIMIT 1");
    const existing = rows[0] || {};

    let image1_url = req.body.existing_image1 || existing.image1_url || null;
    let image2_url = req.body.existing_image2 || existing.image2_url || null;

    if (files.image1) {
      const uploaded1 = await uploadToCloudinary(files.image1[0].buffer, "about_us");
      image1_url = uploaded1.url;
    }

    if (files.image2) {
      const uploaded2 = await uploadToCloudinary(files.image2[0].buffer, "about_us");
      image2_url = uploaded2.url;
    }

    if (existing.id) {
      await db.execute(
        "UPDATE about_us SET heading=?, description=?, image1_url=?, image2_url=?, updated_at=NOW() WHERE id=?",
        [heading || null, description || null, image1_url, image2_url, existing.id]
      );
    } else {
      await db.execute(
        "INSERT INTO about_us (heading, description, image1_url, image2_url) VALUES (?, ?, ?, ?)",
        [heading || null, description || null, image1_url, image2_url]
      );
    }

    const [updatedRows] = await db.execute("SELECT * FROM about_us ORDER BY id DESC LIMIT 1");
    const updatedAbout = updatedRows[0];

    const [aboutRows] = await db.execute("SELECT * FROM about_page_details ORDER BY id DESC LIMIT 1");
    const abouts = aboutRows[0] || {};

    res.render("admin_about-us", { about: updatedAbout, abouts, successMessage: "About Us updated successfully!" });
  } catch (err) {
    console.error("❌ POST /about-us Error:", err);
    res.status(500).send("Server Error");
  }
});

// POST Update About Page Details (Table 2)
router.post("/about-us/update", upload.fields([
  { name: "choose_image1_url", maxCount: 1 },
  { name: "choose_image2_url", maxCount: 1 },
  { name: "choose_image3_url", maxCount: 1 }
]), async (req, res) => {
  try {
    const data = req.body;

    const [rows] = await db.execute("SELECT * FROM about_page_details ORDER BY id DESC LIMIT 1");
    const about = rows[0] || {};

    const files = req.files;
    const uploadedImages = {};

    for (let key of ["choose_image1_url", "choose_image2_url", "choose_image3_url"]) {
  if (files[key]) {
    const uploaded = await uploadToCloudinary(files[key][0].buffer, "about_page");
    uploadedImages[key] = uploaded.url; // use .url from your helper
  } else {
    uploadedImages[key] = data[`existing_${key}`] || null;
  }
}


    if (about.id) {
      await db.execute(`
        UPDATE about_page_details SET
          years_experience=?, employees=?, projects_completed=?, happy_clients=?,
          vision_heading=?, vision_description=?,
          mission_heading=?, mission_description=?,
          goal_heading=?, goal_description=?,
          choose_heading=?, choose_description=?,
          choose_image1_url=?, choose_image2_url=?, choose_image3_url=?,
          updated_at=CURRENT_TIMESTAMP
        WHERE id=?
      `, [
        data.years_experience || 0,
        data.employees || 0,
        data.projects_completed || 0,
        data.happy_clients || 0,
        data.vision_heading || "",
        data.vision_description || "",
        data.mission_heading || "",
        data.mission_description || "",
        data.goal_heading || "",
        data.goal_description || "",
        data.choose_heading || "",
        data.choose_description || "",
        uploadedImages.choose_image1_url,
        uploadedImages.choose_image2_url,
        uploadedImages.choose_image3_url,
        about.id
      ]);
    } else {
      await db.execute(`
        INSERT INTO about_page_details (
          years_experience, employees, projects_completed, happy_clients,
          vision_heading, vision_description,
          mission_heading, mission_description,
          goal_heading, goal_description,
          choose_heading, choose_description,
          choose_image1_url, choose_image2_url, choose_image3_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        data.years_experience || 0,
        data.employees || 0,
        data.projects_completed || 0,
        data.happy_clients || 0,
        data.vision_heading || "",
        data.vision_description || "",
        data.mission_heading || "",
        data.mission_description || "",
        data.goal_heading || "",
        data.goal_description || "",
        data.choose_heading || "",
        data.choose_description || "",
        uploadedImages.choose_image1_url,
        uploadedImages.choose_image2_url,
        uploadedImages.choose_image3_url
      ]);
    }

    // Fetch latest data to show after update
    const [updatedAboutRows] = await db.execute("SELECT * FROM about_us ORDER BY id DESC LIMIT 1");
    const updatedAbout = updatedAboutRows[0] || {};
    const [updatedAboutsRows] = await db.execute("SELECT * FROM about_page_details ORDER BY id DESC LIMIT 1");
    const updatedAbouts = updatedAboutsRows[0] || {};

    res.render("admin_about-us", {
      about: updatedAbout,
      abouts: updatedAbouts,
      successMessage: "Company details updated successfully!"
    });

  } catch (err) {
    console.error("❌ POST /about-us/update Error:", err);
    res.status(500).send("Server Error");
  }
});

// -------- Clients Management --------

// GET clients
router.get("/clients", async (req, res) => {
  try {
    const [clients] = await db.execute("SELECT * FROM clients ORDER BY id DESC");

    res.render("admin_clients", {
      clients: clients || [],
      successMessage: req.query.success || null,
      errorMessage: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.render("admin_clients", {
      clients: [],
      successMessage: null,
      errorMessage: "Failed to load clients."
    });
  }
});

// POST Upload new clients
router.post("/clients/upload", upload.array("images", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.redirect("/admin/clients?error=No files selected for upload");
    }

    for (const file of req.files) {
      const uploaded = await uploadToCloudinary(file.buffer, "clients");
      await db.execute(
        "INSERT INTO clients (client_name, image_url, public_id) VALUES (?, ?, ?)",
        [null, uploaded.url, uploaded.public_id]
      );
    }

    res.redirect("/admin/clients?success=Client logos uploaded successfully");
  } catch (err) {
    console.error("❌ POST /clients/upload error:", err);
    res.redirect("/admin/clients?error=Failed to upload client logos");
  }
});

// POST Delete a client
router.post("/clients/:id/delete", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM clients WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: "Client not found" });

    const client = rows[0];
    if (client.public_id) await deleteFromCloudinary(client.public_id);

    await db.execute("DELETE FROM clients WHERE id = ?", [req.params.id]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to delete client" });
  }
});


// Gallery routes (similar to your clients routes)
router.get("/gallery", async (req, res) => {
  try {
    const [images] = await db.execute("SELECT * FROM gallery ORDER BY id DESC");
    
    res.render("admin_gallery", {
      images: images || [],
      successMessage: req.query.success || null,
      errorMessage: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.render("admin_gallery", {
      images: [],
      successMessage: null,
      errorMessage: "Failed to load gallery images."
    });
  }
});

router.post("/gallery/upload", upload.array("images", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.redirect("/admin/gallery?error=No files selected for upload");
    }

    for (const file of req.files) {
      const uploaded = await uploadToCloudinary(file.buffer, "gallery");
      await db.execute(
        "INSERT INTO gallery (image_url, public_id) VALUES (?, ?)",
        [uploaded.url, uploaded.public_id]
      );
    }

    res.redirect("/admin/gallery?success=Gallery images uploaded successfully");
  } catch (err) {
    console.error("❌ POST /gallery/upload error:", err);
    res.redirect("/admin/gallery?error=Failed to upload gallery images");
  }
});

router.post("/gallery/:id/delete", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM gallery WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.redirect("/admin/gallery?error=Image not found");

    const image = rows[0];

    if (image.public_id) {
      await deleteFromCloudinary(image.public_id);
    }

    await db.execute("DELETE FROM gallery WHERE id = ?", [req.params.id]);

    res.redirect("/admin/gallery?success=Image deleted successfully");
  } catch (err) {
    console.error("❌ POST /gallery/:id/delete error:", err);
    res.redirect("/admin/gallery?error=Failed to delete image");
  }
});

// GET Testimonial Page
router.get("/testimonial", async (req, res) => {
  try {
    // Fetch testimonial section data
    const [sectionRows] = await db.execute("SELECT * FROM testimonial_section LIMIT 1");
    const sectionData = sectionRows[0] || {};
    
    // Fetch testimonial entries
    const [testimonials] = await db.execute("SELECT * FROM testimonial_entries ORDER BY created_at DESC");

    res.render("admin_testimonial", {
      sectionData: sectionData || {},
      testimonials: testimonials || [],
      successMessage: req.query.success || null,
      errorMessage: req.query.error || null
    });
  } catch (err) {
    console.error("❌ GET /admin/testimonial error:", err);
    res.render("admin/admin_testimonial", {
      sectionData: {},
      testimonials: [],
      successMessage: null,
      errorMessage: "Failed to load testimonials"
    });
  }
});

// POST Update Testimonial Section
router.post("/testimonial/section/update", async (req, res) => {
  try {
    const { title, sub_title } = req.body;

    // Check if section exists
    const [existingRows] = await db.execute("SELECT * FROM testimonial_section LIMIT 1");
    
    if (existingRows.length > 0) {
      // Update existing
      await db.execute(
        "UPDATE testimonial_section SET title = ?, sub_title = ? WHERE id = ?",
        [title, sub_title, existingRows[0].id]
      );
    } else {
      // Insert new
      await db.execute(
        "INSERT INTO testimonial_section (title, sub_title) VALUES (?, ?)",
        [title, sub_title]
      );
    }

    res.redirect("/admin/testimonial?success=Testimonial section updated successfully");
  } catch (err) {
    console.error("❌ POST /admin/testimonial/section/update error:", err);
    res.redirect("/admin/testimonial?error=Failed to update testimonial section");
  }
});


// POST Add New Testimonial
router.post("/testimonial/add", upload.single("client_image"), async (req, res) => {
  try {
    const { testimonial_text, client_name, designation } = req.body;
    
    let client_image_url = null;
    let public_id = null;

    if (req.file) {
      const uploaded = await uploadToCloudinary(req.file.buffer, "testimonials");
      client_image_url = uploaded.url;
      public_id = uploaded.public_id;
    }

    await db.execute(
      "INSERT INTO testimonial_entries (testimonial_text, client_name, designation, client_image, public_id) VALUES (?, ?, ?, ?, ?)",
      [testimonial_text, client_name, designation, client_image_url, public_id]
    );

    res.redirect("/admin/testimonial?success=Testimonial added successfully");
  } catch (err) {
    console.error("❌ POST /admin/testimonial/add error:", err);
    res.redirect("/admin/testimonial?error=Failed to add testimonial");
  }
});

// POST Update Testimonial
router.post("/testimonial/:id/update", upload.single("client_image"), async (req, res) => {
  try {
    const testimonialId = req.params.id;
    const { testimonial_text, client_name, designation } = req.body;

    // Get current testimonial
    const [rows] = await db.execute("SELECT * FROM testimonial_entries WHERE id = ?", [testimonialId]);
    if (!rows.length) {
      return res.redirect("/admin/testimonial?error=Testimonial not found");
    }

    const currentTestimonial = rows[0];
    let client_image_url = currentTestimonial.client_image;
    let public_id = currentTestimonial.public_id;

    // Handle new image upload
    if (req.file) {
      // Delete old image from Cloudinary
      if (currentTestimonial.public_id) {
        await deleteFromCloudinary(currentTestimonial.public_id);
      }
      
      const uploaded = await uploadToCloudinary(req.file.buffer, "testimonials");
      client_image_url = uploaded.url;
      public_id = uploaded.public_id;
    }

    await db.execute(
      "UPDATE testimonial_entries SET testimonial_text = ?, client_name = ?, designation = ?, client_image = ?, public_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [testimonial_text, client_name, designation, client_image_url, public_id, testimonialId]
    );

    res.redirect("/admin/testimonial?success=Testimonial updated successfully");
  } catch (err) {
    console.error("❌ POST /admin/testimonial/update error:", err);
    res.redirect("/admin/testimonial?error=Failed to update testimonial");
  }
});

// POST Delete Testimonial
router.post("/testimonial/:id/delete", async (req, res) => {
  try {
    const testimonialId = req.params.id;

    // Get testimonial data
    const [rows] = await db.execute("SELECT * FROM testimonial_entries WHERE id = ?", [testimonialId]);
    if (!rows.length) {
      return res.redirect("/admin/testimonial?error=Testimonial not found");
    }

    const testimonial = rows[0];

    // Delete image from Cloudinary
    if (testimonial.public_id) {
      await deleteFromCloudinary(testimonial.public_id);
    }

    // Delete from database
    await db.execute("DELETE FROM testimonial_entries WHERE id = ?", [testimonialId]);

    res.redirect("/admin/testimonial?success=Testimonial deleted successfully");
  } catch (err) {
    console.error("❌ POST /admin/testimonial/delete error:", err);
    res.redirect("/admin/testimonial?error=Failed to delete testimonial");
  }
});


// GET Who We Are Page
router.get("/who_we_are", async (req, res) => {
  try {
    // Fetch who_we_are section data
    const [rows] = await db.execute("SELECT * FROM who_we_are_section LIMIT 1");
    const sectionData = rows[0] || {};

    res.render("admin_who_we_are", {
      sectionData: sectionData || {},
      successMessage: req.query.success || null,
      errorMessage: req.query.error || null
    });
  } catch (err) {
    console.error("❌ GET /who_we_are error:", err);
    res.render('admin_about-us', {
  sectionData,
  successMessage: req.flash('success'),
  errorMessage: req.flash('error')
});
  }
});

// POST Update Who We Are Section
router.post("/who_we_are/update", upload.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 }
]), async (req, res) => {
  try {
    const { 
      title, 
      sub_title, 
      description, 
      custom_heading, 
      custom_description, 
      technical_heading, 
      technical_description 
    } = req.body;

    // Check if section exists
    const [existingRows] = await db.execute("SELECT * FROM who_we_are_section LIMIT 1");
    
    let image1_url = existingRows.length > 0 ? existingRows[0].image1 : null;
    let image2_url = existingRows.length > 0 ? existingRows[0].image2 : null;
    let image3_url = existingRows.length > 0 ? existingRows[0].image3 : null;
    let public_id1 = null, public_id2 = null, public_id3 = null;

    // Handle image uploads
    if (req.files) {
      // Image 1
      if (req.files.image1 && req.files.image1[0]) {
        if (existingRows.length > 0 && existingRows[0].public_id1) {
          await deleteFromCloudinary(existingRows[0].public_id1);
        }
        const uploaded = await uploadToCloudinary(req.files.image1[0].buffer, "who_we_are");
        image1_url = uploaded.url;
        public_id1 = uploaded.public_id;
      }

      // Image 2
      if (req.files.image2 && req.files.image2[0]) {
        if (existingRows.length > 0 && existingRows[0].public_id2) {
          await deleteFromCloudinary(existingRows[0].public_id2);
        }
        const uploaded = await uploadToCloudinary(req.files.image2[0].buffer, "who_we_are");
        image2_url = uploaded.url;
        public_id2 = uploaded.public_id;
      }

      // Image 3
      if (req.files.image3 && req.files.image3[0]) {
        if (existingRows.length > 0 && existingRows[0].public_id3) {
          await deleteFromCloudinary(existingRows[0].public_id3);
        }
        const uploaded = await uploadToCloudinary(req.files.image3[0].buffer, "who_we_are");
        image3_url = uploaded.url;
        public_id3 = uploaded.public_id;
      }
    }

    if (existingRows.length > 0) {
      // Update existing
      await db.execute(
        `UPDATE who_we_are_section SET 
          title = ?, sub_title = ?, description = ?, 
          image1 = ?, image2 = ?, image3 = ?,
          custom_heading = ?, custom_description = ?,
          technical_heading = ?, technical_description = ?,
          public_id1 = ?, public_id2 = ?, public_id3 = ?,
          updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [
          title, sub_title, description,
          image1_url, image2_url, image3_url,
          custom_heading, custom_description,
          technical_heading, technical_description,
          public_id1, public_id2, public_id3,
          existingRows[0].id
        ]
      );
    } else {
      // Insert new
      await db.execute(
        `INSERT INTO who_we_are_section 
         (title, sub_title, description, image1, image2, image3, custom_heading, custom_description, technical_heading, technical_description, public_id1, public_id2, public_id3) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title, sub_title, description,
          image1_url, image2_url, image3_url,
          custom_heading, custom_description,
          technical_heading, technical_description,
          public_id1, public_id2, public_id3
        ]
      );
    }

    req.flash('success', 'Who We Are section updated successfully');
res.redirect('/admin/who_we_are');  // <-- corrected path
  } catch (err) {
    console.error("❌ POST /who_we_are/update error:", err);
    // res.redirect("/who_we_are?error=Failed to update Who We Are section");
    req.flash('fail', 'Failed to update Who We Are section');
res.redirect('/admin/who_we_are');  
  }
});



// GET Settings Page
router.get("/settings", async (req, res) => {
  try {
    // Fetch site settings
    const [settingsRows] = await db.execute("SELECT * FROM site_settings LIMIT 1");
    const settings = settingsRows[0] || {};
    
    // Fetch admin info (without password)
    const [adminRows] = await db.execute("SELECT id, username, created_at FROM admin LIMIT 1");
    const adminInfo = adminRows[0] || {};

    res.render("admin_settings", {
      settings: settings || {},
      adminInfo: adminInfo || {},
      successMessage: req.query.success || null,
      errorMessage: req.query.error || null
    });
  } catch (err) {
    console.error("❌ GET /settings error:", err);
    res.render("admin_settings", {
      settings: {},
      adminInfo: {},
      successMessage: null,
      errorMessage: "Failed to load settings"
    });
  }
});

// POST Update Site Settings
router.post("/settings/update", upload.fields([
  { name: 'logo1', maxCount: 1 },
  { name: 'logo2', maxCount: 1 },
  { name: 'favicon', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      site_name,
      description,
      email,
      phone,
      address,
      facebook_url,
      whatsapp_url,
      instagram_url,
      twitter_url,
      linkedin_url
    } = req.body;

    // Check if settings exist
    const [existingRows] = await db.execute("SELECT * FROM site_settings LIMIT 1");
    
    let logo1_url = existingRows.length > 0 ? existingRows[0].logo1_url : null;
    let logo2_url = existingRows.length > 0 ? existingRows[0].logo2_url : null;
    let favicon_url = existingRows.length > 0 ? existingRows[0].favicon_url : null;
    let public_id_logo1 = null, public_id_logo2 = null, public_id_favicon = null;

    // Handle file uploads
    if (req.files) {
      // Logo 1
      if (req.files.logo1 && req.files.logo1[0]) {
        if (existingRows.length > 0 && existingRows[0].public_id_logo1) {
          await deleteFromCloudinary(existingRows[0].public_id_logo1);
        }
        const uploaded = await uploadToCloudinary(req.files.logo1[0].buffer, "site_settings");
        logo1_url = uploaded.url;
        public_id_logo1 = uploaded.public_id;
      }

      // Logo 2
      if (req.files.logo2 && req.files.logo2[0]) {
        if (existingRows.length > 0 && existingRows[0].public_id_logo2) {
          await deleteFromCloudinary(existingRows[0].public_id_logo2);
        }
        const uploaded = await uploadToCloudinary(req.files.logo2[0].buffer, "site_settings");
        logo2_url = uploaded.url;
        public_id_logo2 = uploaded.public_id;
      }

      // Favicon
      if (req.files.favicon && req.files.favicon[0]) {
        if (existingRows.length > 0 && existingRows[0].public_id_favicon) {
          await deleteFromCloudinary(existingRows[0].public_id_favicon);
        }
        const uploaded = await uploadToCloudinary(req.files.favicon[0].buffer, "site_settings");
        favicon_url = uploaded.url;
        public_id_favicon = uploaded.public_id;
      }
    }

    if (existingRows.length > 0) {
      // Update existing settings
      await db.execute(
        `UPDATE site_settings SET 
          site_name = ?, description = ?, logo1_url = ?, logo2_url = ?, favicon_url = ?,
          email = ?, phone = ?, address = ?, facebook_url = ?, whatsapp_url = ?,
          instagram_url = ?, twitter_url = ?, linkedin_url = ?,
          public_id_logo1 = ?, public_id_logo2 = ?, public_id_favicon = ?,
          updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [
          site_name, description, logo1_url, logo2_url, favicon_url,
          email, phone, address, facebook_url, whatsapp_url,
          instagram_url, twitter_url, linkedin_url,
          public_id_logo1, public_id_logo2, public_id_favicon,
          existingRows[0].id
        ]
      );
    } else {
      // Insert new settings
      await db.execute(
        `INSERT INTO site_settings 
         (site_name, description, logo1_url, logo2_url, favicon_url, email, phone, address, 
          facebook_url, whatsapp_url, instagram_url, twitter_url, linkedin_url,
          public_id_logo1, public_id_logo2, public_id_favicon) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          site_name, description, logo1_url, logo2_url, favicon_url,
          email, phone, address, facebook_url, whatsapp_url,
          instagram_url, twitter_url, linkedin_url,
          public_id_logo1, public_id_logo2, public_id_favicon
        ]
      );
    }

    res.redirect("/admin/settings?success=Site settings updated successfully");
  } catch (err) {
    console.error("❌ POST /admin/settings/update error:", err);
    res.redirect("/admin/settings?error=Failed to update site settings");
  }
});

// POST Change Admin Credentials
router.post("/settings/change-credentials", async (req, res) => {
  try {
    const { current_username, current_password, new_username, new_password, confirm_password } = req.body;

    // Validate required fields
    if (!current_username || !current_password || !new_password || !confirm_password) {
      return res.redirect("/admin/settings?error=All fields are required");
    }

    // Check if new passwords match
    if (new_password !== confirm_password) {
      return res.redirect("/admin/settings?error=New passwords do not match");
    }

    // Verify current credentials
    const [adminRows] = await db.execute("SELECT * FROM admin LIMIT 1");
    if (!adminRows.length) {
      return res.redirect("/admin/settings?error=Admin account not found");
    }

    const admin = adminRows[0];

    // Verify current username and password
    const isCurrentUsernameValid = current_username === admin.username;
    const isCurrentPasswordValid = await bcrypt.compare(current_password, admin.password);

    if (!isCurrentUsernameValid || !isCurrentPasswordValid) {
      return res.redirect("/admin/settings?error=Current username or password is incorrect");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update credentials
    await db.execute(
      "UPDATE admin SET username = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [new_username || admin.username, hashedPassword, admin.id]
    );

    res.redirect("/admin/settings?success=Credentials updated successfully");
  } catch (err) {
    console.error("❌ POST /admin/settings/change-credentials error:", err);
    res.redirect("/admin/settings?error=Failed to update credentials");
  }
});


// GET SEO Settings Page
router.get("/seo-settings", async (req, res) => {
  try {
    // Fetch all SEO settings
    const [seoSettings] = await db.execute("SELECT * FROM seo_settings ORDER BY page_slug ASC");

    res.render("admin_seo", {
      seoSettings: seoSettings || [],
      successMessage: req.query.success || null,
      errorMessage: req.query.error || null
    });
  } catch (err) {
    console.error("❌ GET /admin/seo-settings error:", err);
    res.render("admin_seo", {
      seoSettings: [],
      successMessage: null,
      errorMessage: "Failed to load SEO settings"
    });
  }
});

// POST Add New SEO Setting
router.post("/seo-settings/add", upload.fields([
  { name: 'og_image', maxCount: 1 },
  { name: 'twitter_image', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      page_slug,
      title,
      description,
      keywords,
      og_title,
      og_description,
      twitter_title,
      twitter_description
    } = req.body;

    // Check if page slug already exists
    const [existingRows] = await db.execute("SELECT * FROM seo_settings WHERE page_slug = ?", [page_slug]);
    if (existingRows.length > 0) {
      return res.redirect("/admin/seo-settings?error=Page slug already exists");
    }

    let og_image_url = null;
    let twitter_image_url = null;
    let public_id_og = null;
    let public_id_twitter = null;

    // Handle image uploads
    if (req.files) {
      // OG Image
      if (req.files.og_image && req.files.og_image[0]) {
        const uploaded = await uploadToCloudinary(req.files.og_image[0].buffer, "seo");
        og_image_url = uploaded.url;
        public_id_og = uploaded.public_id;
      }

      // Twitter Image
      if (req.files.twitter_image && req.files.twitter_image[0]) {
        const uploaded = await uploadToCloudinary(req.files.twitter_image[0].buffer, "seo");
        twitter_image_url = uploaded.url;
        public_id_twitter = uploaded.public_id;
      }
    }

    await db.execute(
      `INSERT INTO seo_settings 
       (page_slug, title, description, keywords, og_title, og_description, og_image, 
        twitter_title, twitter_description, twitter_image, public_id_og, public_id_twitter) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        page_slug, title, description, keywords, og_title, og_description, og_image_url,
        twitter_title, twitter_description, twitter_image_url, public_id_og, public_id_twitter
      ]
    );

    res.redirect("/admin/seo-settings?success=SEO settings added successfully");
  } catch (err) {
    console.error("❌ POST /admin/seo-settings/add error:", err);
    res.redirect("/admin/seo-settings?error=Failed to add SEO settings");
  }
});

// POST Update SEO Setting
router.post("/seo-settings/:id/update", upload.fields([
  { name: 'og_image', maxCount: 1 },
  { name: 'twitter_image', maxCount: 1 }
]), async (req, res) => {
  try {
    const seoId = req.params.id;
    const {
      page_slug,
      title,
      description,
      keywords,
      og_title,
      og_description,
      twitter_title,
      twitter_description
    } = req.body;

    // Get current SEO setting
    const [rows] = await db.execute("SELECT * FROM seo_settings WHERE id = ?", [seoId]);
    if (!rows.length) {
      return res.redirect("/admin/seo-settings?error=SEO setting not found");
    }

    const currentSeo = rows[0];
    let og_image_url = currentSeo.og_image;
    let twitter_image_url = currentSeo.twitter_image;
    let public_id_og = currentSeo.public_id_og;
    let public_id_twitter = currentSeo.public_id_twitter;

    // Handle image uploads
    if (req.files) {
      // OG Image
      if (req.files.og_image && req.files.og_image[0]) {
        // Delete old image
        if (currentSeo.public_id_og) {
          await deleteFromCloudinary(currentSeo.public_id_og);
        }
        const uploaded = await uploadToCloudinary(req.files.og_image[0].buffer, "seo");
        og_image_url = uploaded.url;
        public_id_og = uploaded.public_id;
      }

      // Twitter Image
      if (req.files.twitter_image && req.files.twitter_image[0]) {
        // Delete old image
        if (currentSeo.public_id_twitter) {
          await deleteFromCloudinary(currentSeo.public_id_twitter);
        }
        const uploaded = await uploadToCloudinary(req.files.twitter_image[0].buffer, "seo");
        twitter_image_url = uploaded.url;
        public_id_twitter = uploaded.public_id;
      }
    }

    await db.execute(
      `UPDATE seo_settings SET 
        page_slug = ?, title = ?, description = ?, keywords = ?, 
        og_title = ?, og_description = ?, og_image = ?,
        twitter_title = ?, twitter_description = ?, twitter_image = ?,
        public_id_og = ?, public_id_twitter = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [
        page_slug, title, description, keywords, og_title, og_description, og_image_url,
        twitter_title, twitter_description, twitter_image_url, public_id_og, public_id_twitter, seoId
      ]
    );

    res.redirect("/admin/seo-settings?success=SEO settings updated successfully");
  } catch (err) {
    console.error("❌ POST /admin/seo-settings/update error:", err);
    res.redirect("/admin/seo-settings?error=Failed to update SEO settings");
  }
});

// POST Delete SEO Setting
router.post("/seo-settings/:id/delete", async (req, res) => {
  try {
    const seoId = req.params.id;

    // Get SEO setting data
    const [rows] = await db.execute("SELECT * FROM seo_settings WHERE id = ?", [seoId]);
    if (!rows.length) {
      return res.redirect("/admin/seo-settings?error=SEO setting not found");
    }

    const seoSetting = rows[0];

    // Delete images from Cloudinary
    if (seoSetting.public_id_og) {
      await deleteFromCloudinary(seoSetting.public_id_og);
    }
    if (seoSetting.public_id_twitter) {
      await deleteFromCloudinary(seoSetting.public_id_twitter);
    }

    // Delete from database
    await db.execute("DELETE FROM seo_settings WHERE id = ?", [seoId]);

    res.redirect("/admin/seo-settings?success=SEO settings deleted successfully");
  } catch (err) {
    console.error("❌ POST /admin/seo-settings/delete error:", err);
    res.redirect("/admin/seo-settings?error=Failed to delete SEO settings");
  }
});

module.exports = router;
