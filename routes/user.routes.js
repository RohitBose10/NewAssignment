const express = require("express");
const router = express.Router();

// Controllers
const userController = require("../controllers/user.controller");
const categoryController = require("../controllers/category.controller");
const postController = require("../controllers/post.controller");

// Middleware
const auth = require("../middlewares/auth")();
const FileUploader = require("../helper/fileUpload");

// File upload setup
const fileUploader = new FileUploader({
  folderName: "uploads/profile-images",
  supportedFiles: ["image/png", "image/jpg", "image/jpeg"],
  fieldSize: 1024 * 1024 * 5, // 5MB
});

// ========== USER ROUTES ==========

// Signup with profile image upload
router.post(
  "/user/signup",
  fileUploader.upload().single("profileImage"),
  userController.signup
);

// Email verification
router.post("/user/verifyEmail", userController.verifyEmail);

// Signin
router.post("/user/signin", userController.signin);

// Get profile
router.get(
  "/user/profile",
  auth.authenticateAPI,
  userController.profileDetails
);

// Edit profile with profile image upload
router.put(
  "/user/editProfile",
  auth.authenticateAPI,
  fileUploader.upload().single("profileImage"),
  userController.editProfile
);

// ========== CATEGORY ROUTES ==========

// Add category
router.post(
  "/user/category",
  auth.authenticateAPI,
  categoryController.addCategory
);

// Get categories with posts
router.get("/user/getcategory", categoryController.listCategoriesWithPosts);

// ========== POST ROUTES ==========

// Add new post
router.post("/user/posts", auth.authenticateAPI, postController.addPosts);
// Get all posts

router.get(
  "/user/getposts",

  postController.listPosts
);

//Update post
router.put(
  "/user/editpost/:id",
  auth.authenticateAPI,
  postController.updatePost
);
// Delete post
router.delete(
  "/user/deletepost/:id",
  auth.authenticateAPI,
  postController.deletePost
);

// Like a post
router.post(
  "/posts/like/:postId",
  auth.authenticateAPI,
  postController.likePost
);

// Comment on a post
router.post(
  "/posts/comment/:postId",
  auth.authenticateAPI,
  postController.commentOnPost
);

module.exports = router;
