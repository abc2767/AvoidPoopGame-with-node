const express = require("express");
const router = express.Router();
const passport = require("passport");
const { isLoggedIn, isNotLoggedIn } = require("../middlewares");
const { join, login, logout } = require("../controllers/auth");
//POST /auth/join
router.post("/join", isNotLoggedIn, join);
// Post /auth/login
router.post("/login", isNotLoggedIn, login);

//GET /auth/logout
router.get("/logout", isLoggedIn, logout);
module.exports = router;
