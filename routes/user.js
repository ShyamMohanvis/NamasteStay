const express = require("express");
const router = express.Router() ;
const User= require("../models/user");
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const flash=require("connect-flash");
const {saveRedirectUrl}=require("../middleware.js");
const userController=require ("../controllers/user.js");

router.get("/signup",userController.renderSignUpForm);

router.get("/login",userController.renderLoginForm);

router.post(
  "/signup",
  wrapAsync(userController.signUp)
);
    
router.post(
  "/login",
  saveRedirectUrl,
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  userController.login
);

      
router.get("/logout",userController.logout);

module.exports = router;