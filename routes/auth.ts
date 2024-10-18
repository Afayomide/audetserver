const express = require("express");
const router = express.Router();
import { verifyToken } from "../verifyToken";
import { checkAuth, login, signUp, logOut, forgotPassword, ResetPassword } from "../controllers/auth";

router.route("/checkAuth").get( verifyToken, checkAuth,);

router.route("/login").post(login);

router.route("/signup").post( verifyToken, signUp);

router.route("/logout").post(logOut);

router.route('/forgot-password').post(forgotPassword);

router.route('/reset-password').post(ResetPassword);

module.exports = router;
