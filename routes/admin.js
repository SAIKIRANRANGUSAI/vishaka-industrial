const express = require("express");
const router = express.Router();
const authController = require("../controllers/controllers");
const db = require("../config/db");
const multer = require("multer");
const { uploadToCloudinary, deleteFromCloudinary } = require("../helpers/cloudinaryUpload");

// Multer temp storage for uploads
const upload = multer({ dest: "uploads/" });

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
          const uploaded = await uploadToCloudinary(file.path, folder);

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
            const uploaded = await uploadToCloudinary(req.file.path, "services");
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
            const uploaded = await uploadToCloudinary(req.file.path, "services");
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
      const uploaded1 = await uploadToCloudinary(files.image1[0].path, "about_us");
      image1_url = uploaded1.url;
    }

    if (files.image2) {
      const uploaded2 = await uploadToCloudinary(files.image2[0].path, "about_us");
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
    const uploaded = await uploadToCloudinary(files[key][0].path, "about_page");
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


module.exports = router;
