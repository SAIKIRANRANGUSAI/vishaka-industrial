// const express = require("express");
// const router = express.Router();
// const db = require("../config/db");
// const multer = require("multer");
// const cloudinary = require("../config/cloudinary"); // your Cloudinary config
// const fs = require("fs");
// const bcrypt = require('bcryptjs'); // For password hashing

// const Controller = require("../controllers/Controller");
// const { isAuthenticated } = Controller;

// // Multer setup
// const storage = multer.diskStorage({});
// const upload = multer({ storage });
// // const storage = new CloudinaryStorage({
// //   cloudinary,
// //   params: {
// //     folder: "school/messages",
// //     allowed_formats: ["jpg", "jpeg", "png", "webp"],
// //     transformation: [{ width: 400, height: 400, crop: "fill" }],
// //   },
// // });

// // const upload = multer({ storage });


// // ✅ Login page (GET)
// router.get("/login", (req, res) => {
//   res.render("admin/login", { error: null });
// });

// // ✅ Login form submission (POST)
// router.post("/login", Controller.postLogin);

// // ✅ Logout route (clear cookie)
// router.get("/logout", (req, res) => {
//   res.clearCookie("token");
//   res.redirect("/admin/login");
// });

// router.get("/dashboard", async (req, res) => {
//   try {
//     const contactPerPage = 10;
//     const alumniPerPage = 10;

//     const contactCurrentPage = parseInt(req.query.contactPage, 10) || 1;
//     const alumniCurrentPage = parseInt(req.query.alumniPage, 10) || 1;

//     const contactOffset = (contactCurrentPage - 1) * contactPerPage;
//     const alumniOffset = (alumniCurrentPage - 1) * alumniPerPage;

//     // Total counts
//     const [[contactCount]] = await db.execute("SELECT COUNT(*) as total FROM contact_messages");
//     const [[alumniCount]] = await db.execute("SELECT COUNT(*) as total FROM alumni");

//     // Paginated queries (interpolated)
//     const [contactMessages] = await db.execute(
//       `SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT ${contactPerPage} OFFSET ${contactOffset}`
//     );

//     const [alumniRegistrations] = await db.execute(
//       `SELECT * FROM alumni ORDER BY created_at DESC LIMIT ${alumniPerPage} OFFSET ${alumniOffset}`
//     );

//     res.render("admin/admin_dashboard", {
//       contactMessages,
//       alumniRegistrations,
//       contactStats: { totalMessages: contactCount.total },
//       alumniStats: { totalAlumni: alumniCount.total },
//       contactCurrentPage,
//       alumniCurrentPage,
//       contactTotalPages: Math.ceil(contactCount.total / contactPerPage),
//       alumniTotalPages: Math.ceil(alumniCount.total / alumniPerPage),
//       contactPerPage,
//       alumniPerPage
//     });
//   } catch (error) {
//     console.error("Error loading dashboard:", error);
//     res.status(500).send("Error loading dashboard");
//   }
// });
// // Get single contact message (for modal)
// router.get("/dashboard/contact-message/:id", async (req, res) => {
//   try {
//     const [rows] = await db.execute("SELECT * FROM contact_messages WHERE id = ?", [req.params.id]);

//     if (rows.length === 0) {
//       return res.json({ success: false, message: "Message not found" });
//     }

//     res.json({ success: true, message: rows[0] });
//   } catch (error) {
//     console.error("Error fetching contact message:", error);
//     res.json({ success: false, message: "Error fetching message" });
//   }
// });

// // Get single alumni (for modal)
// router.get("/dashboard/alumni/:id", async (req, res) => {
//   try {
//     const [rows] = await db.execute("SELECT * FROM alumni WHERE id = ?", [req.params.id]);

//     if (rows.length === 0) {
//       return res.json({ success: false, message: "Alumni not found" });
//     }

//     res.json({ success: true, alumni: rows[0] });
//   } catch (error) {
//     console.error("Error fetching alumni:", error);
//     res.json({ success: false, message: "Error fetching alumni" });
//   }
// });

// // Delete contact message
// router.delete("/dashboard/contact-message/delete/:id", async (req, res) => {
//   try {
//     await db.execute("DELETE FROM contact_messages WHERE id = ?", [req.params.id]);
//     res.json({ success: true });
//   } catch (error) {
//     console.error("Error deleting contact message:", error);
//     res.json({ success: false, message: "Error deleting message" });
//   }
// });

// // Delete alumni
// router.delete("/dashboard/alumni/delete/:id", async (req, res) => {
//   try {
//     await db.execute("DELETE FROM alumni WHERE id = ?", [req.params.id]);
//     res.json({ success: true });
//   } catch (error) {
//     console.error("Error deleting alumni:", error);
//     res.json({ success: false, message: "Error deleting alumni" });
//   }
// });


// // ------------------- HERO SECTION ROUTES ------------------- //

// // GET hero section (display current DB values in inputs)

// // Home page admin: show all home sections (hero, etc.)
// // GET hero/home section
// // GET Home Page
// router.get("/home", isAuthenticated, async (req, res) => {
//   try {
//     const [rows] = await db.query("SELECT * FROM hero_section WHERE id = 1");
//     const homeContent = rows[0] || {};
//     const [rowss] = await db.query("SELECT * FROM core_values ORDER BY id ASC");
//     const values = rowss;
//     const [siteRows] = await db.query("SELECT * FROM site_content LIMIT 1");
//     const content = siteRows[0] || {};
//     const [whyRows] = await db.query("SELECT * FROM why_choose_us WHERE id = 1");
//     const why = whyRows[0] || {};
//     const [rowsf] = await db.query("SELECT * FROM fun_classes WHERE id = 1");
//     const fun = rowsf[0] || {};
//     const [slides] = await db.query("SELECT * FROM beyond_classrooms ORDER BY id ASC");

//     const [rowsx] = await db.query("SELECT * FROM fun_facts LIMIT 1");
//     const funFacts = rowsx[0] || {};


//     res.render("admin/admin_home", { homeContent, values, content, why, fun, slides, funFacts });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Server error");
//   }
// });

// // POST Home Update
// router.post(
//   "/home/update",
//   isAuthenticated,
//   upload.fields([
//     { name: "background_image", maxCount: 1 },
//     { name: "hero_image", maxCount: 1 },
//     { name: "funfact_image", maxCount: 1 },
//   ]),
//   async (req, res) => {
//     try {
//       const { main_heading, main_description, sub_heading, youtube_link, total_students } = req.body;

//       const [rows] = await db.query("SELECT * FROM hero_section WHERE id = 1");
//       const hero = rows[0] || {};

//       let background_image = hero.background_image;
//       let hero_image = hero.hero_image;
//       let funfact_image = hero.funfact_image;

//       if (req.files["background_image"]) {
//         const bgResult = await cloudinary.uploader.upload(req.files["background_image"][0].path, {
//           folder: "harvesttenderroots/hero",
//         });
//         background_image = bgResult.secure_url;
//         fs.unlinkSync(req.files["background_image"][0].path);
//       }

//       if (req.files["hero_image"]) {
//         const heroResult = await cloudinary.uploader.upload(req.files["hero_image"][0].path, {
//           folder: "harvesttenderroots/hero",
//         });
//         hero_image = heroResult.secure_url;
//         fs.unlinkSync(req.files["hero_image"][0].path);
//       }

//       if (req.files["funfact_image"]) {
//         const funResult = await cloudinary.uploader.upload(req.files["funfact_image"][0].path, {
//           folder: "harvesttenderroots/hero",
//         });
//         funfact_image = funResult.secure_url;
//         fs.unlinkSync(req.files["funfact_image"][0].path);
//       }

//       if (!hero.id) {
//         await db.query(
//           `INSERT INTO hero_section 
//             (main_heading, main_description, sub_heading, youtube_link, total_students, background_image, hero_image, funfact_image)
//            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//           [main_heading, main_description, sub_heading, youtube_link, total_students, background_image, hero_image, funfact_image]
//         );
//       } else {
//         await db.query(
//           `UPDATE hero_section SET 
//             main_heading=?, main_description=?, sub_heading=?, youtube_link=?, total_students=?,
//             background_image=?, hero_image=?, funfact_image=? 
//            WHERE id=1`,
//           [main_heading, main_description, sub_heading, youtube_link, total_students, background_image, hero_image, funfact_image]
//         );
//       }

//       res.redirect("/admin/home");
//     } catch (err) {
//       console.error(err);
//       res.status(500).send("Server error");
//     }
//   }
// );

// // =======================
// // CREATE Core Value
// // =======================
// router.post("/core-values/create", upload.single("image"), async (req, res) => {
//   try {
//     const { heading } = req.body;
//     let image = null;

//     if (req.file) {
//       // Upload to Cloudinary
//       const result = await cloudinary.uploader.upload(req.file.path, {
//         folder: "harvesttenderroots/core-values"
//       });
//       image = result.secure_url;
//       fs.unlinkSync(req.file.path);
//     }

//     await db.query("INSERT INTO core_values (heading, image) VALUES (?, ?)", [heading, image]);
//     res.redirect("/admin/home");
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Server Error");
//   }
// });

// // =======================
// // UPDATE Core Value
// // =======================
// router.post("/core-values/update/:id", upload.single("image"), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { heading } = req.body;

//     // Get old image
//     const [rows] = await db.query("SELECT image FROM core_values WHERE id = ?", [id]);
//     let image = rows.length ? rows[0].image : null;

//     if (req.file) {
//       const result = await cloudinary.uploader.upload(req.file.path, {
//         folder: "harvesttenderroots/core-values"
//       });
//       image = result.secure_url;
//       fs.unlinkSync(req.file.path);
//     }

//     await db.query("UPDATE core_values SET heading = ?, image = ? WHERE id = ?", [heading, image, id]);
//     res.redirect("/admin/home");
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Server Error");
//   }
// });

// // =======================
// // DELETE Core Value
// // =======================
// router.post("/core-values/delete/:id", async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Optional: delete from Cloudinary
//     const [rows] = await db.query("SELECT image FROM core_values WHERE id = ?", [id]);
//     if (rows.length && rows[0].image) {
//       // Extract public_id from Cloudinary URL
//       const publicId = rows[0].image.split("/").pop().split(".")[0];
//       await cloudinary.uploader.destroy(`harvesttenderroots/core-values/${publicId}`);
//     }

//     await db.query("DELETE FROM core_values WHERE id = ?", [id]);
//     res.redirect("/admin/home");
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Server Error");
//   }
// });

// // GET site content for admin
// router.get("/site-content", isAuthenticated, async (req, res) => {
//   const [rows] = await db.query("SELECT * FROM site_content WHERE id = 1");
//   const content = rows[0] || {};
//   res.render("admin/site_content", { content });
// });

// // POST update site content
// router.post("/site-content/update", isAuthenticated, upload.fields([
//   { name: "home1_image", maxCount: 1 },
//   { name: "home2_image", maxCount: 1 },
//   { name: "home3_image", maxCount: 1 },
//   { name: "about1_image", maxCount: 1 },
//   { name: "about2_image", maxCount: 1 },
//   { name: "about3_image", maxCount: 1 },
//   { name: "mission_image", maxCount: 1 },
//   { name: "vision_image", maxCount: 1 },
// ]), async (req, res) => {
//   try {
//     const body = req.body;
//     const [rows] = await db.query("SELECT * FROM site_content WHERE id = 1");
//     const content = rows[0] || {};

//     // Function to upload image to Cloudinary if provided
//     const uploadImage = async (file, folder) => {
//       if (!file) return null;
//       const result = await cloudinary.uploader.upload(file.path, { folder });
//       fs.unlinkSync(file.path);
//       return result.secure_url;
//     };

//     // Home images
//     const home1_image = req.files["home1_image"] ? await uploadImage(req.files["home1_image"][0], "home") : content.home1_image;
//     const home2_image = req.files["home2_image"] ? await uploadImage(req.files["home2_image"][0], "home") : content.home2_image;
//     const home3_image = req.files["home3_image"] ? await uploadImage(req.files["home3_image"][0], "home") : content.home3_image;

//     // About images
//     const about1_image = req.files["about1_image"] ? await uploadImage(req.files["about1_image"][0], "about") : content.about1_image;
//     const about2_image = req.files["about2_image"] ? await uploadImage(req.files["about2_image"][0], "about") : content.about2_image;
//     const about3_image = req.files["about3_image"] ? await uploadImage(req.files["about3_image"][0], "about") : content.about3_image;

//     // Mission & Vision images
//     const mission_image = req.files["mission_image"] ? await uploadImage(req.files["mission_image"][0], "mission_vision") : content.mission_image;
//     const vision_image = req.files["vision_image"] ? await uploadImage(req.files["vision_image"][0], "mission_vision") : content.vision_image;

//     if (!content.id) {
//       await db.query(`INSERT INTO site_content 
//                 (main_heading, main_description, homeabout_heading, homeabout_description,
//                  home1_image, home2_image, home3_image, 
//                  about_home_heading, about_home_description, about1_image, about2_image, about3_image,
//                  mission_heading, mission_description, mission_image,
//                  vision_heading, vision_description, vision_image)
//                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//         [
//           body.main_heading, body.main_description, body.homeabout_heading, body.homeabout_description,
//           home1_image, home2_image, home3_image,
//           body.about_home_heading, body.about_home_description,
//           about1_image, about2_image, about3_image,
//           body.mission_heading, body.mission_description, mission_image,
//           body.vision_heading, body.vision_description, vision_image
//         ]
//       );
//     } else {
//       await db.query(`
//     UPDATE site_content SET
//         main_heading = ?,
//         main_description = ?,
//         homeabout_heading = ?,
//         homeabout_description = ?,
//         home1_image = ?,
//         home2_image = ?,
//         home3_image = ?,
//         about_home_heading = ?,
//         about_home_description = ?,
//         about1_image = ?,
//         about2_image = ?,
//         about3_image = ?,
//         mission_heading = ?,
//         mission_description = ?,
//         mission_image = ?,
//         vision_heading = ?,
//         vision_description = ?,
//         vision_image = ?
//     WHERE id = 1
// `, [
//         body.main_heading || '',
//         body.main_description || '',
//         body.homeabout_heading || '',
//         body.homeabout_description || '',
//         home1_image,
//         home2_image,
//         home3_image,
//         body.about_home_heading || '',
//         body.about_home_description || '',
//         about1_image,
//         about2_image,
//         about3_image,
//         body.mission_heading || '',
//         body.mission_description || '',
//         mission_image,
//         body.vision_heading || '',
//         body.vision_description || '',
//         vision_image
//       ]);


//     }

//     res.redirect("/admin/home");
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Server error");
//   }
// });

// // =======================
// // WHY CHOOSE US (with Cloudinary)
// // =======================


// router.post("/why-choose-us/update", upload.single("image"), isAuthenticated, async (req, res) => {
//   try {
//     const body = req.body;

//     // Convert empty strings to null
//     Object.keys(body).forEach(key => {
//       if (body[key] === "") body[key] = null;
//     });

//     // Upload new image if provided
//     let image = null;
//     if (req.file) {
//       const result = await cloudinary.uploader.upload(req.file.path, {
//         folder: "harvesttenderroots/why-choose-us"
//       });
//       image = result.secure_url;

//       try { fs.unlinkSync(req.file.path); }
//       catch (err) { console.warn("Temp file not found, skipping delete:", err.message); }

//       console.log("Cloudinary URL:", image); // check if URL is coming
//     }

//     // Fetch existing row
//     const [rows] = await db.query("SELECT * FROM why_choose_us WHERE id = 1");
//     const content = rows[0] || {};

//     if (!content.id) {
//       // Insert new row
//       await db.query(
//         `INSERT INTO why_choose_us 
//           (main_heading, main_description, celebration_link,
//            values_heading, values_description,
//            mission_heading, mission_description,
//            vision_heading, vision_description, image)
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//         [
//           body.main_heading,
//           body.main_description,
//           body.celebration_link,
//           body.values_heading,
//           body.values_description,
//           body.mission_heading,
//           body.mission_description,
//           body.vision_heading,
//           body.vision_description,
//           image
//         ]
//       );
//     } else {
//       // Update existing row
//       await db.query(
//         `UPDATE why_choose_us SET
//           main_heading = ?, 
//           main_description = ?, 
//           celebration_link = ?,
//           values_heading = ?, 
//           values_description = ?,
//           mission_heading = ?, 
//           mission_description = ?,
//           vision_heading = ?, 
//           vision_description = ?,
//           image = COALESCE(?, image)
//          WHERE id = 1`,
//         [
//           body.main_heading,
//           body.main_description,
//           body.celebration_link,
//           body.values_heading,
//           body.values_description,
//           body.mission_heading,
//           body.mission_description,
//           body.vision_heading,
//           body.vision_description,
//           image
//         ]
//       );
//     }

//     res.redirect("/admin/home");
//   } catch (err) {
//     console.error("WHY CHOOSE US update error:", err);
//     res.status(500).send("Server error");
//   }
// });

// // =======================
// // FUN CLASSES (with Cloudinary)
// // =======================
// router.post("/fun-classes/update", upload.single("image"), isAuthenticated, async (req, res) => {
//   try {
//     const body = req.body;
//     let image = null;

//     // Upload new image if provided
//     if (req.file) {
//       const result = await cloudinary.uploader.upload(req.file.path, {
//         folder: "harvesttenderroots/fun-classes"
//       });
//       image = result.secure_url;
//       fs.unlinkSync(req.file.path); // remove local temp file
//     }

//     const [rows] = await db.query("SELECT * FROM fun_classes WHERE id = 1");
//     const fun = rows[0] || {};

//     if (!fun.id) {
//       // Insert
//       await db.query(
//         `INSERT INTO fun_classes (heading, description, youtube_link, image)
//          VALUES (?, ?, ?, ?)`,
//         [body.heading, body.description, body.youtube_link, image]
//       );
//     } else {
//       // Update
//       await db.query(
//         `UPDATE fun_classes SET 
//            heading = ?, 
//            description = ?, 
//            youtube_link = ?, 
//            image = COALESCE(?, image)
//          WHERE id = 1`,
//         [body.heading, body.description, body.youtube_link, image]
//       );
//     }

//     res.redirect("/admin/home");
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Server error");
//   }
// });

// // Show all about us info
// router.get("/about-us", async (req, res) => {
//   try {
//     const [rows] = await db.query("SELECT * FROM school_info ORDER BY id ASC");
//     const [messages] = await db.query("SELECT * FROM messages ORDER BY id ASC");
//     res.render("admin/admin_about-us", {
//       infoList: rows,
//       formMode: false,
//       info: null,
//       messages,
//     });
//   } catch (err) {
//     console.error("Error fetching about us info:", err);
//     res.status(500).send("Server error");
//   }
// });

// // Show Add Form
// router.get("/about-us/add", async (req, res) => {
//   try {
//     const [rows] = await db.query("SELECT * FROM school_info ORDER BY id ASC");
//     res.render("admin/admin_about-us", {
//       infoList: rows,
//       formMode: true,
//       info: null,
//     });
//   } catch (err) {
//     console.error("Error loading add form:", err);
//     res.status(500).send("Server error");
//   }
// });

// // Handle Add
// router.post("/about-us/add", async (req, res) => {
//   try {
//     const { field_name, field_value } = req.body;
//     await db.query(
//       "INSERT INTO school_info (field_name, field_value) VALUES (?, ?)",
//       [field_name, field_value]
//     );
//     res.redirect("/admin/about-us");
//   } catch (err) {
//     console.error("Error adding about us info:", err);
//     res.status(500).send("Server error");
//   }
// });

// // Show Edit Form
// router.get("/about-us/edit/:id", async (req, res) => {
//   try {
//     const id = req.params.id;
//     const [rows] = await db.query("SELECT * FROM school_info ORDER BY id ASC");
//     const [record] = await db.query("SELECT * FROM school_info WHERE id = ?", [
//       id,
//     ]);
//     res.render("admin/admin_about-us", {
//       infoList: rows,
//       formMode: true,
//       info: record[0] || null,
//     });
//   } catch (err) {
//     console.error("Error loading edit form:", err);
//     res.status(500).send("Server error");
//   }
// });

// // Handle Edit
// router.post("/about-us/edit/:id", async (req, res) => {
//   try {
//     const id = req.params.id;
//     const { field_name, field_value } = req.body;
//     await db.query(
//       "UPDATE school_info SET field_name = ?, field_value = ? WHERE id = ?",
//       [field_name, field_value, id]
//     );
//     res.redirect("/admin/about-us");
//   } catch (err) {
//     console.error("Error updating about us info:", err);
//     res.status(500).send("Server error");
//   }
// });

// // Delete
// router.get("/about-us/delete/:id", async (req, res) => {
//   try {
//     const id = req.params.id;
//     await db.query("DELETE FROM school_info WHERE id = ?", [id]);
//     res.redirect("/admin/about-us");
//   } catch (err) {
//     console.error("Error deleting about us info:", err);
//     res.status(500).send("Server error");
//   }
// });


// // =======================
// // GET ALL PRINCIPAL MESSAGES (Admin Page)
// // =======================
// router.get("/principal-message", async (req, res) => {
//   try {
//     const [messages] = await db.query("SELECT * FROM principal_message ORDER BY id DESC");
//     res.render("admin/principal-message", { messages });
//   } catch (err) {
//     console.error("Error fetching principal messages:", err);
//     res.status(500).send("Error loading principal messages");
//   }
// });


// // =======================
// // ADD PRINCIPAL MESSAGE (with Cloudinary)
// // =======================
// router.post("/principal-message/add", upload.single("image"), async (req, res) => {
//   try {
//     const {
//       name,
//       role,
//       message_to_students,
//       message_to_staff,
//       social_facebook,
//       social_twitter,
//       social_skype,
//       social_linkedin,
//     } = req.body;

//     let imageUrl = null;

//     if (req.file) {
//       const result = await cloudinary.uploader.upload(req.file.path, {
//         folder: "harvesttenderroots/principal-message",
//       });
//       imageUrl = result.secure_url;
//       fs.unlinkSync(req.file.path);
//     }

//     await db.query(
//       `INSERT INTO principal_message 
//       (name, role, image, message_to_students, message_to_staff, social_facebook, social_twitter, social_skype, social_linkedin)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         name,
//         role,
//         imageUrl,
//         message_to_students,
//         message_to_staff,
//         social_facebook,
//         social_twitter,
//         social_skype,
//         social_linkedin,
//       ]
//     );

//     res.redirect("/admin/principal-message");
//   } catch (err) {
//     console.error("Error adding principal message:", err);
//     res.status(500).send("Error adding principal message");
//   }
// });


// // =======================
// // EDIT PRINCIPAL MESSAGE
// // =======================
// router.post("/principal-message/edit/:id", upload.single("image"), async (req, res) => {
//   try {
//     const {
//       name,
//       role,
//       message_to_students,
//       message_to_staff,
//       social_facebook,
//       social_twitter,
//       social_skype,
//       social_linkedin,
//       existing_image,
//     } = req.body;

//     const id = req.params.id;
//     let imageUrl = existing_image || null;

//     if (req.file) {
//       try {
//         const result = await cloudinary.uploader.upload(req.file.path, {
//           folder: "harvesttenderroots/principal-message",
//         });
//         imageUrl = result.secure_url;
//         fs.unlinkSync(req.file.path);
//       } catch (cloudErr) {
//         console.error("Cloudinary upload failed:", cloudErr);
//       }
//     }

//     await db.query(
//       `UPDATE principal_message 
//        SET name=?, role=?, image=?, message_to_students=?, message_to_staff=?, 
//            social_facebook=?, social_twitter=?, social_skype=?, social_linkedin=? 
//        WHERE id=?`,
//       [
//         name,
//         role,
//         imageUrl,
//         message_to_students,
//         message_to_staff,
//         social_facebook,
//         social_twitter,
//         social_skype,
//         social_linkedin,
//         id,
//       ]
//     );

//     res.redirect("/admin/principal-message");
//   } catch (err) {
//     console.error("Error editing principal message:", err);
//     res.status(500).send("Error editing principal message");
//   }
// });


// // =======================
// // DELETE PRINCIPAL MESSAGE
// // =======================
// router.post("/principal-message/delete/:id", async (req, res) => {
//   try {
//     const id = req.params.id;

//     const [rows] = await db.query("SELECT image FROM principal_message WHERE id=?", [id]);

//     if (rows.length && rows[0].image) {
//       const imageUrl = rows[0].image;

//       try {
//         const urlParts = imageUrl.split("/");
//         const fileName = urlParts.pop();
//         const folderPath = urlParts.slice(urlParts.indexOf("harvesttenderroots")).join("/");
//         const publicId = `${folderPath}/${fileName.split(".")[0]}`;

//         await cloudinary.uploader.destroy(publicId);
//       } catch (cloudErr) {
//         console.error("Cloudinary delete failed:", cloudErr);
//       }
//     }

//     await db.query("DELETE FROM principal_message WHERE id=?", [id]);

//     res.redirect("/admin/principal-message");
//   } catch (err) {
//     console.error("Error deleting principal message:", err);
//     res.status(500).send("Error deleting principal message");
//   }
// });


// router.post("/beyond-classrooms/create", isAuthenticated, upload.single("image"), async (req, res) => {
//   try {
//     const { title } = req.body;
//     let imageUrl = null;

//     if (req.file) {
//       const result = await cloudinary.uploader.upload(req.file.path, {
//         folder: "harvesttenderroots/beyond-classrooms"
//       });
//       imageUrl = result.secure_url;
//       fs.unlinkSync(req.file.path);
//     }

//     await db.query(
//       "INSERT INTO beyond_classrooms (title, image) VALUES (?, ?)",
//       [title, imageUrl]
//     );

//     res.redirect("/admin/home#beyond-classrooms");
//   } catch (err) {
//     console.error("Error creating beyond classroom slide:", err);
//     res.status(500).send("Server error");
//   }
// });

// // POST Update Beyond Classroom Slide
// router.post("/beyond-classrooms/update/:id", isAuthenticated, upload.single("image"), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { title, existing_image } = req.body;

//     let imageUrl = existing_image || null;

//     if (req.file) {
//       // Delete old image from Cloudinary if exists
//       if (existing_image) {
//         try {
//           const urlParts = existing_image.split("/");
//           const fileName = urlParts.pop();
//           const folderPath = urlParts.slice(urlParts.indexOf("harvesttenderroots")).join("/");
//           const publicId = `${folderPath}/${fileName.split(".")[0]}`;
//           await cloudinary.uploader.destroy(publicId);
//         } catch (cloudErr) {
//           console.error("Cloudinary delete failed:", cloudErr);
//         }
//       }

//       // Upload new image
//       const result = await cloudinary.uploader.upload(req.file.path, {
//         folder: "harvesttenderroots/beyond-classrooms"
//       });
//       imageUrl = result.secure_url;
//       fs.unlinkSync(req.file.path);
//     }

//     await db.query(
//       "UPDATE beyond_classrooms SET title = ?, image = ? WHERE id = ?",
//       [title, imageUrl, id]
//     );

//     res.redirect("/admin/home#beyond-classrooms");
//   } catch (err) {
//     console.error("Error updating beyond classroom slide:", err);
//     res.status(500).send("Server error");
//   }
// });

// // POST Delete Beyond Classroom Slide
// router.post("/beyond-classrooms/delete/:id", isAuthenticated, async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Get the slide to delete its image from Cloudinary
//     const [rows] = await db.query("SELECT image FROM beyond_classrooms WHERE id = ?", [id]);

//     if (rows.length && rows[0].image) {
//       try {
//         const imageUrl = rows[0].image;
//         const urlParts = imageUrl.split("/");
//         const fileName = urlParts.pop();
//         const folderPath = urlParts.slice(urlParts.indexOf("harvesttenderroots")).join("/");
//         const publicId = `${folderPath}/${fileName.split(".")[0]}`;

//         await cloudinary.uploader.destroy(publicId);
//       } catch (cloudErr) {
//         console.error("Cloudinary delete failed:", cloudErr);
//       }
//     }

//     await db.query("DELETE FROM beyond_classrooms WHERE id = ?", [id]);
//     res.redirect("/admin/home#beyond-classrooms");
//   } catch (err) {
//     console.error("Error deleting beyond classroom slide:", err);
//     res.status(500).send("Server error");
//   }
// });

// router.post(
//   "/fun-facts/update",
//   isAuthenticated,
//   upload.fields([
//     { name: "image1", maxCount: 1 },
//     { name: "image2", maxCount: 1 },
//     { name: "image3", maxCount: 1 },
//     { name: "image4", maxCount: 1 },
//   ]),
//   async (req, res) => {
//     try {
//       const body = req.body;

//       const [rows] = await db.query("SELECT * FROM fun_facts LIMIT 1");
//       const funFacts = rows[0] || {};

//       const uploadImage = async (file, folder) => {
//         if (!file) return null;
//         const result = await cloudinary.uploader.upload(file.path, { folder });
//         fs.unlinkSync(file.path);
//         return result.secure_url;
//       };

//       const image1 = req.files["image1"] ? await uploadImage(req.files["image1"][0], "fun-facts") : funFacts.image1;
//       const image2 = req.files["image2"] ? await uploadImage(req.files["image2"][0], "fun-facts") : funFacts.image2;
//       const image3 = req.files["image3"] ? await uploadImage(req.files["image3"][0], "fun-facts") : funFacts.image3;
//       const image4 = req.files["image4"] ? await uploadImage(req.files["image4"][0], "fun-facts") : funFacts.image4;

//       if (!funFacts.id) {
//         // Insert new row
//         await db.query(
//           `INSERT INTO fun_facts 
//             (heading1, number1, image1, heading2, number2, image2, heading3, number3, image3, heading4, number4, image4)
//            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//           [
//             body.heading1, body.number1, image1,
//             body.heading2, body.number2, image2,
//             body.heading3, body.number3, image3,
//             body.heading4, body.number4, image4
//           ]
//         );
//       } else {
//         // Update existing row
//         await db.query(
//           `UPDATE fun_facts SET 
//             heading1=?, number1=?, image1=?,
//             heading2=?, number2=?, image2=?,
//             heading3=?, number3=?, image3=?,
//             heading4=?, number4=?, image4=?
//            WHERE id=?`,
//           [
//             body.heading1, body.number1, image1,
//             body.heading2, body.number2, image2,
//             body.heading3, body.number3, image3,
//             body.heading4, body.number4, image4,
//             funFacts.id
//           ]
//         );
//       }

//       res.redirect("/admin/home");
//     } catch (err) {
//       console.error(err);
//       res.status(500).send("Server error");
//     }
//   }
// );
// // GET admin admission page
// router.get('/admission', async (req, res) => {
//   try {
//     // Admission info (content + image)
//     const [infoRows] = await db.query('SELECT * FROM admission_info LIMIT 1');

//     // Admission fees table
//     const [rows] = await db.query('SELECT * FROM admissions ORDER BY id ASC');
//     res.render('admin/admin_admission', {
//       admission_info: infoRows[0] || null,  // for content & image
//       admissions_fee: rows, currentPage: 'admission'
//     });
//   } catch (error) {
//     console.error('Error loading admission page:', error);
//     res.status(500).send('Error loading admission page');
//   }
// });


// // POST: Update admission info
// router.post('/admission/update', upload.single('image'), async (req, res) => {
//   try {
//     const { content, currentImage } = req.body;
//     console.log('Received content:', content);
//     console.log('Received currentImage:', currentImage);
//     console.log('Received file:', req.file); // Check if multer is getting the file

//     let imageUrl = currentImage || null;

//     // Upload new image to Cloudinary if provided
//     if (req.file) {
//       console.log('Uploading new image to Cloudinary...');
//       const result = await cloudinary.uploader.upload(req.file.path, {
//         folder: "harvesttenderroots/admission",
//       });
//       imageUrl = result.secure_url;

//       // Delete the temp file
//       fs.unlinkSync(req.file.path);
//     }

//     // Check if a row already exists
//     const [rows] = await db.query('SELECT * FROM admission_info LIMIT 1');
//     console.log('Existing rows:', rows);

//     if (rows.length > 0) {
//       await db.query(
//         'UPDATE admission_info SET content = ?, image = ? WHERE id = ?',
//         [content, imageUrl, rows[0].id]
//       );
//     } else {
//       await db.query(
//         'INSERT INTO admission_info (content, image) VALUES (?, ?)',
//         [content, imageUrl]
//       );
//     }

//     console.log('Admission info updated successfully!');
//     res.redirect('/admin/admission');
//   } catch (error) {
//     console.error('Error updating admission info:', error);
//     res.send('Error updating admission info');
//   }
// });



// // Save Admission Entry
// router.post('/admission/save', async (req, res) => {
//   try {
//     const { id, class_name, admission_fee, term1_fee, term2_fee, term3_fee, term4_fee } = req.body;

//     if (id) {
//       // Update
//       await db.query(
//         `UPDATE admissions 
//          SET class_name = ?, admission_fee = ?, term1_fee = ?, term2_fee = ?, term3_fee = ?, term4_fee = ?
//          WHERE id = ?`,
//         [class_name, admission_fee, term1_fee, term2_fee, term3_fee, term4_fee, id]
//       );
//     } else {
//       // Insert
//       await db.query(
//         `INSERT INTO admissions (class_name, admission_fee, term1_fee, term2_fee, term3_fee, term4_fee)
//          VALUES (?, ?, ?, ?, ?, ?)`,
//         [class_name, admission_fee, term1_fee, term2_fee, term3_fee, term4_fee]
//       );
//     }

//     res.redirect('/admin/admission');
//   } catch (err) {
//     console.error("Error saving admission info:", err);
//     res.send("Error saving admission info");
//   }
// });


// // GET - Delete
// router.get('/admission/delete/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     await db.query('DELETE FROM admissions WHERE id = ?', [id]); // corrected table name
//     res.redirect('/admin/admission');
//   } catch (error) {
//     console.error(error);
//     res.send('Error deleting admission');
//   }
// });


// router.get("/Events", async (req, res) => {
//   try {
//     const [facilities] = await db.execute("SELECT * FROM events ORDER BY event_date DESC");
//     res.render("admin/admin_Events", { facilities, errorMsg: null });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Error fetching Events");
//   }
// });

// // ----- POST: Add Facility -----
// router.post("/Events/add", upload.array("images", 5), async (req, res) => {
//   try {
//     const { event_name, title, description, location, start_time, end_time, event_date } = req.body;

//     // Check max 5 images
//     if (req.files.length > 5) {
//       const [facilities] = await db.execute("SELECT * FROM events ORDER BY event_date DESC");
//       return res.render("admin/Events", { facilities, errorMsg: "You can upload max 5 images only." });
//     }

//     // Upload images to Cloudinary
//     const images = [];
//     for (const file of req.files) {
//       const result = await cloudinary.uploader.upload(file.path, {
//         folder: "harvesttenderroots/Events",
//       });
//       images.push(result.secure_url);
//       fs.unlinkSync(file.path);
//     }

//     // Ensure all 5 image slots have a value or null
//     const [image1, image2, image3, image4, image5] = [
//       images[0] || null,
//       images[1] || null,
//       images[2] || null,
//       images[3] || null,
//       images[4] || null
//     ];

//     const sql = `
//       INSERT INTO events
//       (event_name, title, description, location, start_time, end_time, event_date, image1, image2, image3, image4, image5)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `;
//     await db.execute(sql, [event_name, title, description, location, start_time, end_time, event_date, image1, image2, image3, image4, image5]);

//     res.redirect("/admin/Events");
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Error saving Events");
//   }
// });

// // ----- GET: Delete Facility -----
// router.get("/Events/delete/:id", async (req, res) => {
//   try {
//     const id = req.params.id;
//     await db.execute("DELETE FROM events WHERE id = ?", [id]);
//     res.redirect("/admin/Events");
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Error deleting Events");
//   }
// });

// // ----- POST: Edit Facility -----
// router.post("/Events/edit/:id", upload.array("images", 5), async (req, res) => {
//   try {
//     const id = req.params.id;
//     const { event_name, title, description, location, start_time, end_time, event_date } = req.body;

//     // Fetch current facility
//     const [rows] = await db.execute("SELECT * FROM events WHERE id = ?", [id]);
//     if (!rows[0]) return res.redirect("/admin/Events");
//     const facility = rows[0];

//     // Upload new images if provided
//     const newImages = [];
//     for (const file of req.files) {
//       const result = await cloudinary.uploader.upload(file.path, {
//         folder: "harvesttenderroots/Events",
//       });
//       newImages.push(result.secure_url);
//       fs.unlinkSync(file.path);
//     }

//     // Use new images if provided, else keep old, else null
//     const image1 = newImages[0] || facility.image1 || null;
//     const image2 = newImages[1] || facility.image2 || null;
//     const image3 = newImages[2] || facility.image3 || null;
//     const image4 = newImages[3] || facility.image4 || null;
//     const image5 = newImages[4] || facility.image5 || null;


//     const sql = `
//       UPDATE events
//       SET event_name=?, title=?, description=?, location=?, start_time=?, end_time=?, event_date=?, image1=?, image2=?, image3=?, image4=?, image5=?
//       WHERE id=?
//     `;
//     await db.execute(sql, [event_name, title, description, location, start_time, end_time, event_date, image1, image2, image3, image4, image5, id]);

//     res.redirect("/admin/Events");
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Error updating Events");
//   }
// });

// // ----- GET: All Facilities -----
// router.get("/Facilities", async (req, res) => {
//   try {
//     const [manufacilities] = await db.execute("SELECT * FROM facilities ORDER BY id DESC");
//     res.render("admin/admin_Facilities", { manufacilities, errorMsg: null });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Error fetching facilities");
//   }
// });


// // ----- POST: Add Facility -----
// router.post("/Facilities/add", upload.array("images", 5), async (req, res) => {
//   try {
//     const { facility_name, description } = req.body;

//     if (req.files.length > 5) {
//       const [manufacilities] = await db.execute("SELECT * FROM facilities ORDER BY id DESC");
//       return res.render("admin/admin_Facilities", { manufacilities, errorMsg: "You can upload max 5 images only." });
//     }

//     const images = [];
//     for (const file of req.files) {
//       const result = await cloudinary.uploader.upload(file.path, { folder: "harvesttenderroots/Facilities" });
//       images.push(result.secure_url);
//       fs.unlinkSync(file.path);
//     }

//     const [image1, image2, image3, image4, image5] = [
//       images[0] || null,
//       images[1] || null,
//       images[2] || null,
//       images[3] || null,
//       images[4] || null
//     ];

//     await db.execute(
//       `INSERT INTO facilities (facility_name, description, image1, image2, image3, image4, image5) VALUES (?, ?, ?, ?, ?, ?, ?)`,
//       [facility_name, description, image1, image2, image3, image4, image5]
//     );

//     res.redirect("/admin/Facilities");
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Error saving Facility");
//   }
// });

// // ----- GET: Delete Facility -----
// router.get("/Facilities/delete/:id", async (req, res) => {
//   try {
//     const id = req.params.id;
//     await db.execute("DELETE FROM facilities WHERE id = ?", [id]);
//     res.redirect("/admin/Facilities");
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Error deleting Facility");
//   }
// });

// // ----- POST: Edit Facility -----
// router.post("/Facilities/edit/:id", upload.array("images", 5), async (req, res) => {
//   try {
//     const id = req.params.id;
//     const { facility_name, description } = req.body;

//     const [rows] = await db.execute("SELECT * FROM facilities WHERE id = ?", [id]);
//     if (!rows[0]) return res.redirect("/admin/Facilities");
//     const facility = rows[0];

//     const newImages = [];
//     for (const file of req.files) {
//       const result = await cloudinary.uploader.upload(file.path, { folder: "harvesttenderroots/Facilities" });
//       newImages.push(result.secure_url);
//       fs.unlinkSync(file.path);
//     }

//     const image1 = newImages[0] || facility.image1 || null;
//     const image2 = newImages[1] || facility.image2 || null;
//     const image3 = newImages[2] || facility.image3 || null;
//     const image4 = newImages[3] || facility.image4 || null;
//     const image5 = newImages[4] || facility.image5 || null;

//     await db.execute(
//       `UPDATE facilities SET facility_name=?, description=?, image1=?, image2=?, image3=?, image4=?, image5=? WHERE id=?`,
//       [facility_name, description, image1, image2, image3, image4, image5, id]
//     );

//     res.redirect("/admin/Facilities");
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Error updating Facility");
//   }
// });

// // 1️⃣ List all galleries (Admin)
// router.get("/gallery", async (req, res) => {
//   try {
//     const [galleries] = await db.execute("SELECT * FROM gallery ORDER BY id DESC");
//     res.render("admin/admin_gallery", { galleries, errorMsg: req.query.error || null });
//   } catch (err) {
//     console.error("Gallery fetch error:", err);
//     res.render("admin/admin_gallery", { galleries: [], errorMsg: "Failed to load galleries." });
//   }
// });

// // 2️⃣ Add a new gallery
// router.post(
//   "/gallery/add",
//   upload.fields([{ name: "cover_image", maxCount: 1 }, { name: "images", maxCount: 10 }]),
//   async (req, res) => {
//     try {
//       const { category } = req.body;
//       if (!category || !req.files["cover_image"]) {
//         return res.redirect("/admin/gallery?error=Category and Cover Image required");
//       }

//       // Upload cover image
//       const coverResult = await cloudinary.uploader.upload(req.files["cover_image"][0].path, {
//         folder: "harvesttenderroots/gallery",
//       });
//       const cover_image = coverResult.secure_url;
//       fs.unlinkSync(req.files["cover_image"][0].path);

//       // Upload gallery images
//       const images = [];
//       if (req.files["images"]) {
//         for (const file of req.files["images"]) {
//           const result = await cloudinary.uploader.upload(file.path, {
//             folder: "harvesttenderroots/gallery",
//           });
//           images.push(result.secure_url);
//           fs.unlinkSync(file.path);
//         }
//       }

//       await db.execute(
//         "INSERT INTO gallery (category, cover_image, images) VALUES (?, ?, ?)",
//         [category, cover_image, JSON.stringify(images)]
//       );

//       res.redirect("/admin/gallery");
//     } catch (err) {
//       console.error("Gallery add error:", err);
//       res.redirect("/admin/gallery?error=Failed to add gallery");
//     }
//   }
// );

// // 3️⃣ Edit gallery (category, cover image, add new images)
// router.post(
//   "/gallery/edit/:category",
//   upload.fields([{ name: "cover_image", maxCount: 1 }, { name: "images", maxCount: 10 }]),
//   async (req, res) => {
//     try {
//       const { category } = req.params;
//       const { category_name } = req.body;

//       const [rows] = await db.execute("SELECT * FROM gallery WHERE category = ?", [category]);
//       if (!rows[0]) return res.redirect("/admin/gallery?error=Gallery not found");

//       const gallery = rows[0];

//       // 3a. Update cover image if provided
//       let cover_image = gallery.cover_image;
//       if (req.files?.cover_image?.[0]) {
//         // Delete old cover image from Cloudinary
//         if (gallery.cover_image) {
//           try {
//             const publicId = gallery.cover_image.split("/").pop().split(".")[0];
//             await cloudinary.uploader.destroy(publicId);
//           } catch (err) {
//             console.log("Old cover delete error:", err);
//           }
//         }

//         const coverResult = await cloudinary.uploader.upload(req.files.cover_image[0].path, {
//           folder: "harvesttenderroots/gallery",
//         });
//         cover_image = coverResult.secure_url;
//         fs.unlinkSync(req.files.cover_image[0].path);
//       }

//       // 3b. Append new gallery images if any
//       let imagesArray = JSON.parse(gallery.images || "[]");
//       if (req.files?.images) {
//         for (const file of req.files.images) {
//           const result = await cloudinary.uploader.upload(file.path, {
//             folder: "harvesttenderroots/gallery",
//           });
//           imagesArray.push(result.secure_url);
//           fs.unlinkSync(file.path);
//         }
//       }

//       // 3c. Update DB
//       await db.execute(
//         "UPDATE gallery SET category = ?, cover_image = ?, images = ? WHERE category = ?",
//         [category_name || category, cover_image, JSON.stringify(imagesArray), category]
//       );

//       res.redirect("/admin/gallery");
//     } catch (err) {
//       console.error("Gallery edit error:", err);
//       res.redirect("/admin/gallery?error=Failed to edit gallery: " + err.message);
//     }
//   }
// );

// // 4️⃣ Delete gallery by category
// router.post("/gallery/delete/:category", async (req, res) => {
//   try {
//     const { category } = req.params;
//     const [rows] = await db.execute("SELECT * FROM gallery WHERE category = ?", [category]);
//     if (!rows[0]) return res.redirect("/admin/gallery?error=Gallery not found");

//     const gallery = rows[0];

//     // Delete cover image from Cloudinary
//     if (gallery.cover_image) {
//       const publicId = gallery.cover_image.split("/").pop().split(".")[0];
//       await cloudinary.uploader.destroy(publicId);
//     }

//     // Delete gallery images from Cloudinary
//     const images = JSON.parse(gallery.images || "[]");
//     for (const img of images) {
//       const publicId = img.split("/").pop().split(".")[0];
//       await cloudinary.uploader.destroy(publicId);
//     }

//     // Delete DB row
//     await db.execute("DELETE FROM gallery WHERE category = ?", [category]);

//     res.redirect("/admin/gallery");
//   } catch (err) {
//     console.error("Gallery delete error:", err);
//     res.redirect("/admin/gallery?error=Failed to delete gallery");
//   }
// });

// // 5️⃣ Delete individual image (cover or gallery)
// router.post("/gallery/delete-image", async (req, res) => {
//   try {
//     const { category, imageUrl, imageType } = req.body;
//     const [rows] = await db.execute("SELECT * FROM gallery WHERE category = ?", [category]);
//     if (!rows[0]) return res.redirect("/admin/gallery?error=Gallery not found");

//     const gallery = rows[0];

//     // Delete from Cloudinary
//     if (imageUrl) {
//       const publicId = imageUrl.split("/").pop().split(".")[0];
//       await cloudinary.uploader.destroy(publicId);
//     }

//     // Update DB
//     if (imageType === "cover") {
//       await db.execute("UPDATE gallery SET cover_image = NULL WHERE category = ?", [category]);
//     } else if (imageType === "gallery") {
//       let imagesArray = JSON.parse(gallery.images || "[]");
//       imagesArray = imagesArray.filter(img => img !== imageUrl);
//       await db.execute("UPDATE gallery SET images = ? WHERE category = ?", [JSON.stringify(imagesArray), category]);
//     }

//     res.redirect("/admin/gallery");
//   } catch (err) {
//     console.error("Image delete error:", err);
//     res.redirect("/admin/gallery?error=Failed to delete image");
//   }
// });

// // 6️⃣ Frontend: List galleries
// router.get("/gallery-view", async (req, res) => {
//   try {
//     const [galleries] = await db.execute("SELECT * FROM gallery ORDER BY id DESC");
//     res.render("frontend/gallery", { galleries });
//   } catch (err) {
//     console.error("Frontend gallery error:", err);
//     res.status(500).send("Server error");
//   }
// });

// // 7️⃣ Frontend: Single gallery view
// router.get("/gallery-view/:category", async (req, res) => {
//   try {
//     const { category } = req.params;
//     const [rows] = await db.execute("SELECT * FROM gallery WHERE category = ?", [category]);
//     if (!rows[0]) return res.status(404).send("Gallery not found");

//     const gallery = rows[0];
//     const images = JSON.parse(gallery.images || "[]");
//     res.render("frontend/gallery-view", { gallery, images });
//   } catch (err) {
//     console.error("Single gallery error:", err);
//     res.status(500).send("Server error");
//   }
// });

// // ===== Fixed /administration GET route =====
// router.get("/administration", async (req, res) => {
//   try {
//     // ===== Staff Pagination =====
//     let staffCurrentPage = parseInt(req.query.staffPage, 10) || 1;
//     if (isNaN(staffCurrentPage) || staffCurrentPage < 1) staffCurrentPage = 1;

//     const staffPerPage = 10;
//     const staffOffset = (staffCurrentPage - 1) * staffPerPage;

//     const [staffCountRows] = await db.execute("SELECT COUNT(*) AS count FROM staff");
//     const staffTotalCount = staffCountRows[0].count;
//     const staffTotalPages = Math.ceil(staffTotalCount / staffPerPage);

//     // Use numeric values directly in LIMIT/OFFSET
//     const [staff] = await db.execute(
//       `SELECT * FROM staff ORDER BY id ASC LIMIT ${staffPerPage} OFFSET ${staffOffset}`
//     );

//     // ===== Enrollment Pagination =====
//     let enrollmentCurrentPage = parseInt(req.query.enrollmentPage, 10) || 1;
//     if (isNaN(enrollmentCurrentPage) || enrollmentCurrentPage < 1) enrollmentCurrentPage = 1;

//     const enrollmentPerPage = 10;
//     const enrollmentOffset = (enrollmentCurrentPage - 1) * enrollmentPerPage;

//     const [enrollmentCountRows] = await db.execute("SELECT COUNT(*) AS count FROM student_enrollment");
//     const enrollmentTotalCount = enrollmentCountRows[0].count;
//     const enrollmentTotalPages = Math.ceil(enrollmentTotalCount / enrollmentPerPage);

//     const [enrollments] = await db.execute(
//       `SELECT * FROM student_enrollment ORDER BY id ASC LIMIT ${enrollmentPerPage} OFFSET ${enrollmentOffset}`
//     );

//     // ===== Enrollment Image =====
//     const [images] = await db.execute(
//       "SELECT * FROM enrollment_images ORDER BY id DESC LIMIT 1"
//     );

//     res.render("admin/admin_administration", {
//       staffList: staff,
//       enrollmentList: enrollments,
//       staffTotalCount,
//       staffTotalPages,
//       staffPerPage,
//       staffCurrentPage,
//       enrollmentTotalCount,
//       enrollmentTotalPages,
//       enrollmentPerPage,
//       enrollmentCurrentPage,
//       enrollmentImageData: images.length ? images[0] : null,
//       formMode: false,
//       enrollmentFormMode: false,
//       staffMember: null,
//       currentEnrollment: null
//     });

//   } catch (err) {
//     console.error("Error fetching administration data:", err);
//     res.status(500).send("Error fetching administration data");
//   }
// });

// // ===== Fix all other routes similarly =====

// // ✅ Show Add Staff form
// router.get("/administration/staff/add", async (req, res) => {
//   try {
//     let staffCurrentPage = parseInt(req.query.staffPage, 10) || 1;
//     if (isNaN(staffCurrentPage) || staffCurrentPage < 1) staffCurrentPage = 1;

//     const staffPerPage = 10;
//     const staffOffset = (staffCurrentPage - 1) * staffPerPage;

//     const [staffCountRows] = await db.execute("SELECT COUNT(*) AS count FROM staff");
//     const staffTotalCount = staffCountRows[0].count;
//     const staffTotalPages = Math.ceil(staffTotalCount / staffPerPage);

//     // Use numeric values directly
//     const [staff] = await db.execute(
//       `SELECT * FROM staff ORDER BY id ASC LIMIT ${staffPerPage} OFFSET ${staffOffset}`
//     );

//     // ===== Enrollment data for table =====
//     let enrollmentCurrentPage = parseInt(req.query.enrollmentPage, 10) || 1;
//     if (isNaN(enrollmentCurrentPage) || enrollmentCurrentPage < 1) enrollmentCurrentPage = 1;

//     const enrollmentPerPage = 10;
//     const enrollmentOffset = (enrollmentCurrentPage - 1) * enrollmentPerPage;

//     const [enrollmentCountRows] = await db.execute("SELECT COUNT(*) AS count FROM student_enrollment");
//     const enrollmentTotalCount = enrollmentCountRows[0].count;
//     const enrollmentTotalPages = Math.ceil(enrollmentTotalCount / enrollmentPerPage);

//     const [enrollments] = await db.execute(
//       `SELECT * FROM student_enrollment ORDER BY id ASC LIMIT ${enrollmentPerPage} OFFSET ${enrollmentOffset}`
//     );

//     const [images] = await db.execute("SELECT * FROM enrollment_images ORDER BY id DESC LIMIT 1");

//     res.render("admin/admin_administration", {
//       staffList: staff,
//       enrollmentList: enrollments,
//       staffTotalCount,
//       staffTotalPages,
//       staffPerPage,
//       staffCurrentPage,
//       enrollmentTotalCount,
//       enrollmentTotalPages,
//       enrollmentPerPage,
//       enrollmentCurrentPage,
//       enrollmentImageData: images.length ? images[0] : null,
//       formMode: true,
//       enrollmentFormMode: false,
//       staffMember: null,
//       currentEnrollment: null
//     });

//   } catch (err) {
//     console.error("Error loading staff add form:", err);
//     res.status(500).send("Error loading staff add form");
//   }
// });

// // ✅ Show Edit Staff form
// router.get("/administration/staff/edit/:id", async (req, res) => {
//   try {
//     let staffCurrentPage = parseInt(req.query.staffPage, 10) || 1;
//     if (isNaN(staffCurrentPage) || staffCurrentPage < 1) staffCurrentPage = 1;

//     const staffPerPage = 10;
//     const staffOffset = (staffCurrentPage - 1) * staffPerPage;

//     const [staffCountRows] = await db.execute("SELECT COUNT(*) AS count FROM staff");
//     const staffTotalCount = staffCountRows[0].count;
//     const staffTotalPages = Math.ceil(staffTotalCount / staffPerPage);

//     // Use numeric values directly
//     const [staff] = await db.execute(
//       `SELECT * FROM staff ORDER BY id ASC LIMIT ${staffPerPage} OFFSET ${staffOffset}`
//     );

//     const [staffMember] = await db.execute("SELECT * FROM staff WHERE id = ?", [req.params.id]);
//     if (staffMember.length === 0) return res.status(404).send("Staff not found");

//     // ===== Enrollment data for table =====
//     let enrollmentCurrentPage = parseInt(req.query.enrollmentPage, 10) || 1;
//     if (isNaN(enrollmentCurrentPage) || enrollmentCurrentPage < 1) enrollmentCurrentPage = 1;

//     const enrollmentPerPage = 10;
//     const enrollmentOffset = (enrollmentCurrentPage - 1) * enrollmentPerPage;

//     const [enrollmentCountRows] = await db.execute("SELECT COUNT(*) AS count FROM student_enrollment");
//     const enrollmentTotalCount = enrollmentCountRows[0].count;
//     const enrollmentTotalPages = Math.ceil(enrollmentTotalCount / enrollmentPerPage);

//     const [enrollments] = await db.execute(
//       `SELECT * FROM student_enrollment ORDER BY id ASC LIMIT ${enrollmentPerPage} OFFSET ${enrollmentOffset}`
//     );

//     const [images] = await db.execute("SELECT * FROM enrollment_images ORDER BY id DESC LIMIT 1");

//     res.render("admin/admin_administration", {
//       staffList: staff,
//       enrollmentList: enrollments,
//       staffTotalCount,
//       staffTotalPages,
//       staffPerPage,
//       staffCurrentPage,
//       enrollmentTotalCount,
//       enrollmentTotalPages,
//       enrollmentPerPage,
//       enrollmentCurrentPage,
//       enrollmentImageData: images.length ? images[0] : null,
//       formMode: true,
//       enrollmentFormMode: false,
//       staffMember: staffMember[0],
//       currentEnrollment: null
//     });

//   } catch (err) {
//     console.error("Error loading staff edit form:", err);
//     res.status(500).send("Error loading staff edit form");
//   }
// });
// router.get("/administration/staff/delete/:id", async (req, res) => {
//   try {
//     await db.execute("DELETE FROM staff WHERE id = ?", [req.params.id]);

//     const page = req.query.staffPage || 1;
//     res.redirect(`/admin/administration?staffPage=${page}`);
//   } catch (err) {
//     console.error("Error deleting staff:", err);
//     res.status(500).send("Error deleting staff");
//   }
// });
// // ✅ Show Add Enrollment Form
// // ✅ Show Add Enrollment Form
// router.get("/administration/enrollment/add", async (req, res) => {
//   try {
//     // Staff pagination
//     const staffCurrentPage = Math.max(Number(req.query.staffPage) || 1, 1);
//     const staffPerPage = 10;
//     const staffOffset = (staffCurrentPage - 1) * staffPerPage;

//     const [staffCountRows] = await db.execute("SELECT COUNT(*) AS count FROM staff");
//     const staffTotalCount = staffCountRows[0].count;
//     const staffTotalPages = Math.ceil(staffTotalCount / staffPerPage);

//     // Inject LIMIT and OFFSET directly
//     const [staff] = await db.execute(
//       `SELECT * FROM staff ORDER BY id ASC LIMIT ${staffPerPage} OFFSET ${staffOffset}`
//     );

//     // Enrollment pagination
//     const enrollmentCurrentPage = Math.max(Number(req.query.enrollmentPage) || 1, 1);
//     const enrollmentPerPage = 10;
//     const enrollmentOffset = (enrollmentCurrentPage - 1) * enrollmentPerPage;

//     const [enrollmentCountRows] = await db.execute("SELECT COUNT(*) AS count FROM student_enrollment");
//     const enrollmentTotalCount = enrollmentCountRows[0].count;
//     const enrollmentTotalPages = Math.ceil(enrollmentTotalCount / enrollmentPerPage);

//     // Inject LIMIT and OFFSET directly
//     const [enrollments] = await db.execute(
//       `SELECT * FROM student_enrollment ORDER BY id ASC LIMIT ${enrollmentPerPage} OFFSET ${enrollmentOffset}`
//     );

//     const [images] = await db.execute("SELECT * FROM enrollment_images ORDER BY id DESC LIMIT 1");

//     res.render("admin/admin_administration", {
//       staffList: staff,
//       enrollmentList: enrollments,
//       staffTotalCount,
//       staffTotalPages,
//       staffPerPage,
//       staffCurrentPage,
//       enrollmentTotalCount,
//       enrollmentTotalPages,
//       enrollmentPerPage,
//       enrollmentCurrentPage,
//       enrollmentImageData: images.length ? images[0] : null,
//       formMode: false,
//       enrollmentFormMode: true,
//       staffMember: null,
//       currentEnrollment: null
//     });
//   } catch (err) {
//     console.error("Error loading add enrollment form:", err);
//     res.status(500).send("Error loading add enrollment form");
//   }
// });

// // ✅ Show Edit Enrollment Form
// router.get("/administration/enrollment/edit/:id", async (req, res) => {
//   try {
//     const enrollmentId = req.params.id;
//     const [enrollmentRows] = await db.execute(
//       "SELECT * FROM student_enrollment WHERE id = ?",
//       [enrollmentId]
//     );

//     if (enrollmentRows.length === 0) return res.status(404).send("Enrollment not found");

//     // Staff pagination
//     const staffCurrentPage = Math.max(Number(req.query.staffPage) || 1, 1);
//     const staffPerPage = 10;
//     const staffOffset = (staffCurrentPage - 1) * staffPerPage;

//     const [staffCountRows] = await db.execute("SELECT COUNT(*) AS count FROM staff");
//     const staffTotalCount = staffCountRows[0].count;
//     const staffTotalPages = Math.ceil(staffTotalCount / staffPerPage);

//     // Inject LIMIT and OFFSET directly
//     const [staff] = await db.execute(
//       `SELECT * FROM staff ORDER BY id ASC LIMIT ${staffPerPage} OFFSET ${staffOffset}`
//     );

//     // Enrollment pagination
//     const enrollmentCurrentPage = Math.max(Number(req.query.enrollmentPage) || 1, 1);
//     const enrollmentPerPage = 10;
//     const enrollmentOffset = (enrollmentCurrentPage - 1) * enrollmentPerPage;

//     const [enrollmentCountRows] = await db.execute("SELECT COUNT(*) AS count FROM student_enrollment");
//     const enrollmentTotalCount = enrollmentCountRows[0].count;
//     const enrollmentTotalPages = Math.ceil(enrollmentTotalCount / enrollmentPerPage);

//     const [enrollments] = await db.execute(
//       `SELECT * FROM student_enrollment ORDER BY id ASC LIMIT ${enrollmentPerPage} OFFSET ${enrollmentOffset}`
//     );

//     const [images] = await db.execute("SELECT * FROM enrollment_images ORDER BY id DESC LIMIT 1");

//     res.render("admin/admin_administration", {
//       staffList: staff,
//       enrollmentList: enrollments,
//       staffTotalCount,
//       staffTotalPages,
//       staffPerPage,
//       staffCurrentPage,
//       enrollmentTotalCount,
//       enrollmentTotalPages,
//       enrollmentPerPage,
//       enrollmentCurrentPage,
//       enrollmentImageData: images.length ? images[0] : null,
//       formMode: false,
//       enrollmentFormMode: true,
//       staffMember: null,
//       currentEnrollment: enrollmentRows[0]
//     });
//   } catch (err) {
//     console.error("Error loading edit enrollment form:", err);
//     res.status(500).send("Error loading edit enrollment form");
//   }
// });

// // ✅ Delete Enrollment
// router.get("/administration/enrollment/delete/:id", async (req, res) => {
//   try {
//     const enrollmentId = req.params.id;
//     await db.execute("DELETE FROM student_enrollment WHERE id = ?", [enrollmentId]);

//     const page = req.query.enrollmentPage || 1;
//     res.redirect(`/admin/administration?enrollmentPage=${page}`);
//   } catch (err) {
//     console.error("Error deleting enrollment:", err);
//     res.status(500).send("Error deleting enrollment");
//   }
// });


// // ✅ Handle Add Staff
// router.post("/administration/staff/add", async (req, res) => {
//   try {
//     const {
//       teacher_name,
//       designation,
//       date_of_birth,
//       professional_qualification,
//       experience,
//       trained_status,
//       first_appointment,
//       class_assigned
//     } = req.body;

//     await db.execute(
//       `INSERT INTO staff 
//       (teacher_name, designation, date_of_birth, professional_qualification, experience, trained_status, first_appointment, class_assigned) 
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         teacher_name,
//         designation,
//         date_of_birth,
//         professional_qualification,
//         experience,
//         trained_status,
//         first_appointment || null,
//         class_assigned || null
//       ]
//     );

//     res.redirect("/admin/administration");
//   } catch (err) {
//     console.error("Error adding staff:", err);
//     res.status(500).send("Error adding staff");
//   }
// });

// // ✅ Handle Edit Staff
// router.post("/administration/staff/edit/:id", async (req, res) => {
//   try {
//     const {
//       teacher_name,
//       designation,
//       date_of_birth,
//       professional_qualification,
//       experience,
//       trained_status,
//       first_appointment,
//       class_assigned
//     } = req.body;

//     await db.execute(
//       `UPDATE staff SET 
//         teacher_name=?, designation=?, date_of_birth=?, professional_qualification=?, 
//         experience=?, trained_status=?, first_appointment=?, class_assigned=? 
//         WHERE id=?`,
//       [
//         teacher_name,
//         designation,
//         date_of_birth,
//         professional_qualification,
//         experience,
//         trained_status,
//         first_appointment || null,
//         class_assigned || null,
//         req.params.id
//       ]
//     );

//     res.redirect("/admin/administration");
//   } catch (err) {
//     console.error("Error updating staff:", err);
//     res.status(500).send("Error updating staff");
//   }
// });

// // ✅ Handle Add Enrollment
// router.post("/administration/enrollment/add", async (req, res) => {
//   try {
//     const { class_name, section, enrolment_count } = req.body;

//     // Validation
//     if (!class_name || !enrolment_count) {
//       return res.redirect("/admin/administration/enrollment/add?error=Class name and enrollment count are required");
//     }

//     await db.execute(
//       "INSERT INTO student_enrollment (class_name, section, enrolment_count) VALUES (?, ?, ?)",
//       [class_name, section || 'N/A', enrolment_count]
//     );

//     res.redirect("/admin/administration");
//   } catch (err) {
//     console.error("Error adding enrollment:", err);
//     res.redirect("/admin/administration/enrollment/add?error=Error adding enrollment");
//   }
// });


// // ✅ Handle Edit Enrollment
// router.post("/administration/enrollment/edit/:id", async (req, res) => {
//   try {
//     const enrollmentId = req.params.id;
//     const { class_name, section, enrolment_count } = req.body;

//     // Validation
//     if (!class_name || !enrolment_count) {
//       return res.redirect(`/admin/administration/enrollment/edit/${enrollmentId}?error=Class name and enrollment count are required`);
//     }

//     await db.execute(
//       "UPDATE student_enrollment SET class_name = ?, section = ?, enrolment_count = ? WHERE id = ?",
//       [class_name, section || 'N/A', enrolment_count, enrollmentId]
//     );

//     res.redirect("/admin/administration");
//   } catch (err) {
//     console.error("Error updating enrollment:", err);
//     res.redirect(`/admin/administration/enrollment/edit/${enrollmentId}?error=Error updating enrollment`);
//   }
// });

// // ✅ Delete Enrollment


// router.post("/administration/enrollment/image", isAuthenticated, upload.single("image_file"), async (req, res) => {
//   try {
//     const { alt_text } = req.body;

//     if (!req.file) {
//       return res.redirect("/admin/administration?error=No file uploaded");
//     }

//     // Upload image to Cloudinary
//     const result = await cloudinary.uploader.upload(req.file.path, {
//       folder: "harvesttenderroots/enrollment"
//     });

//     // Remove temporary file
//     fs.unlinkSync(req.file.path);

//     // Check if an image already exists
//     const [existingImage] = await db.execute(
//       "SELECT * FROM enrollment_images ORDER BY id DESC LIMIT 1"
//     );

//     if (existingImage.length > 0) {
//       // Update existing image
//       await db.execute(
//         "UPDATE enrollment_images SET image_url = ?, alt_text = ? WHERE id = ?",
//         [result.secure_url, alt_text || "Student Enrollment", existingImage[0].id]
//       );
//     } else {
//       // Insert new image
//       await db.execute(
//         "INSERT INTO enrollment_images (image_url, alt_text) VALUES (?, ?)",
//         [result.secure_url, alt_text || "Student Enrollment"]
//       );
//     }

//     res.redirect("/admin/administration");
//   } catch (err) {
//     console.error("Error updating enrollment image:", err);
//     res.redirect("/admin/administration?error=Error updating enrollment image");
//   }
// });
// // GET Settings page
// router.get('/settings', async (req, res) => {
//   try {
//     // Fetch site settings
//     const [rows] = await db.execute('SELECT * FROM site_settings WHERE id = 1');
//     const settings = rows[0] || {};

//     // Fetch SEO settings
//     // const [seoSettings] = await db.execute('SELECT * FROM seo_settings ORDER BY id DESC');

//     // Ensure fields exist
//     settings.address = settings.address || '';
//     settings.email = settings.email || '';
//     settings.phone = settings.phone || '';

//     res.render('admin/admin_settings', { settings, credMessage: null });
//   } catch (err) {
//     console.error(err);
//     res.send('Error fetching settings');
//   }
// });

// router.post('/settings', upload.fields([
//   { name: 'site_logo', maxCount: 1 },
//   { name: 'favicon', maxCount: 1 }
// ]), async (req, res) => {
//   try {
//     let { site_title, site_description, facebook, instagram, pinterest, twitter, address, email, phone } = req.body;

//     // Handle Cloudinary uploads
//     const uploads = {};
//     if (req.files['site_logo'] && req.files['site_logo'][0]) {
//       const result = await cloudinary.uploader.upload(req.files['site_logo'][0].path);
//       uploads.site_logo = result.secure_url;
//     }
//     if (req.files['favicon'] && req.files['favicon'][0]) {
//       const result = await cloudinary.uploader.upload(req.files['favicon'][0].path);
//       uploads.favicon = result.secure_url;
//     }

//     // Update database
//     await db.execute(
//       `UPDATE site_settings SET
//         site_logo = COALESCE(?, site_logo),
//         favicon = COALESCE(?, favicon),
//         site_title = ?,
//         site_description = ?,
//         facebook = ?,
//         instagram = ?,
//         pinterest = ?,
//         twitter = ?,
//         address = ?,
//         email = ?,
//         phone = ?,
//         updated_at = CURRENT_TIMESTAMP
//       WHERE id = 1`,
//       [
//         uploads.site_logo || null,
//         uploads.favicon || null,
//         site_title,
//         site_description,
//         facebook,
//         instagram,
//         pinterest,
//         twitter,
//         address,
//         email,
//         phone
//       ]
//     );

//     res.redirect('/admin/settings');
//   } catch (err) {
//     console.error('POST /settings error:', err);
//     res.status(500).send('Error updating settings');
//   }
// });

// // 🔹 Show all SEO settings
// // router.get('/seo-settings', async (req, res) => {
// //   try {
// //     const [rows] = await db.execute('SELECT * FROM seo_settings');
// //     res.render('admin/admin_settings', { seoSettings: rows });
// //   } catch (err) {
// //     console.error(err);
// //     res.send('Error fetching SEO settings');
// //   }
// // });

// // 🔹 Add new SEO setting (GET form)
// // 🔹 Fetch all SEO settings (View)
// router.get('/seo-settings', async (req, res) => {
//   try {
//     const [seoSettings] = await db.execute('SELECT * FROM seo_settings ORDER BY id DESC');
//     res.render('admin/admin_seo', { seoSettings, seo: null });
//   } catch (err) {
//     console.error(err);
//     res.send('Error fetching SEO settings');
//   }
// });

// // 🔹 Add new SEO setting (POST)
// router.post('/seo-settings/add', async (req, res) => {
//   try {
//     const {
//       page_slug,
//       meta_title,
//       meta_description,
//       meta_keywords,
//       og_title,
//       og_description,
//       og_image,
//       twitter_title,
//       twitter_description,
//       twitter_image,
//       canonical_url
//     } = req.body;

//     await db.execute(
//       `INSERT INTO seo_settings 
//       (page_slug, meta_title, meta_description, meta_keywords, og_title, og_description, og_image, twitter_title, twitter_description, twitter_image, canonical_url)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [page_slug, meta_title, meta_description, meta_keywords, og_title, og_description, og_image, twitter_title, twitter_description, twitter_image, canonical_url]
//     );

//     res.redirect('/admin/seo-settings');
//   } catch (err) {
//     console.error(err);
//     res.send('Error adding SEO setting');
//   }
// });

// // 🔹 Edit SEO setting (GET form)
// // router.get('/seo-settings/edit/:id', async (req, res) => {
// //   try {
// //     const seoId = req.params.id;

// //     const [seoRows] = await db.execute('SELECT * FROM seo_settings WHERE id = ?', [seoId]);
// //     if (seoRows.length === 0) return res.redirect('/admin/seo-settings');

// //     const seo = seoRows[0];
// //     const [seoSettings] = await db.execute('SELECT * FROM seo_settings ORDER BY id DESC');

// //     res.render('admin/admin_seo', { seoSettings, seo });
// //   } catch (err) {
// //     console.error(err);
// //     res.send('Error fetching SEO setting for edit');
// //   }
// // });

// // 🔹 Update SEO setting (POST)
// router.post('/seo-settings/edit/:id', async (req, res) => {
//   try {
//     const {
//       page_slug,
//       meta_title,
//       meta_description,
//       meta_keywords,
//       og_title,
//       og_description,
//       og_image,
//       twitter_title,
//       twitter_description,
//       twitter_image,
//       canonical_url
//     } = req.body;

//     await db.execute(
//       `UPDATE seo_settings 
//        SET page_slug=?, meta_title=?, meta_description=?, meta_keywords=?, og_title=?, og_description=?, og_image=?, twitter_title=?, twitter_description=?, twitter_image=?, canonical_url=? 
//        WHERE id=?`,
//       [page_slug, meta_title, meta_description, meta_keywords, og_title, og_description, og_image, twitter_title, twitter_description, twitter_image, canonical_url, req.params.id]
//     );

//     res.redirect('/admin/seo-settings');
//   } catch (err) {
//     console.error(err);
//     res.send('Error updating SEO setting');
//   }
// });

// // 🔹 Delete SEO setting
// router.get('/seo-settings/delete/:id', async (req, res) => {
//   try {
//     await db.execute('DELETE FROM seo_settings WHERE id = ?', [req.params.id]);
//     res.redirect('/admin/seo-settings');
//   } catch (err) {
//     console.error(err);
//     res.send('Error deleting SEO setting');
//   }
// });

// router.post('/change-credentials', async (req, res) => {
//   try {
//     const { current_username, current_password, new_username, new_password, confirm_password } = req.body;

//     if (new_password !== confirm_password) {
//       return res.render('admin/settings', {
//         settings: {}, 
//         seoSettings: [], 
//         credMessage: { type: 'danger', text: 'New passwords do not match.' }
//       });
//     }

//     // Fetch admin from DB
//     const [rows] = await db.execute('SELECT * FROM admins WHERE username = ?', [current_username]);
//     if (!rows.length) {
//       return res.render('admin/settings', {
//         settings: {}, 
//         seoSettings: [], 
//         credMessage: { type: 'danger', text: 'Current username not found.' }
//       });
//     }

//     const admin = rows[0];

//     // Compare current password
//     const passwordMatch = await bcrypt.compare(current_password, admin.password);
//     if (!passwordMatch) {
//       return res.render('admin/settings', {
//         settings: {}, 
//         seoSettings: [], 
//         credMessage: { type: 'danger', text: 'Current password is incorrect.' }
//       });
//     }

//     // Hash new password
//     const hashedPassword = await bcrypt.hash(new_password, 10);

//     // Update username & password
//     await db.execute('UPDATE admins SET username = ?, password = ? WHERE id = ?', [new_username, hashedPassword, admin.id]);

//     res.render('admin/admin_settings', {
//       settings: {}, 
//       seoSettings: [], 
//       credMessage: { type: 'success', text: 'Admin credentials updated successfully.' }
//     });

//   } catch (err) {
//     console.error(err);
//     res.render('admin/admin_settings', {
//       settings: {}, 
//       seoSettings: [], 
//       credMessage: { type: 'danger', text: 'Error updating credentials.' }
//     });
//   }
// });

// module.exports = router;
