import express  from "express";
import { register , login, followuser, logout, updatePassword, updateProfile, deleteMyprofile, myProfile, getProfileofOthers, getAllUsers, forgetPassword, resetpassword, getMyposts, getUserposts } from "../Controllers/User.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router=express.Router();
router.post("/register",register)
router.post("/login",login);
router.get("/logout",logout);

router.get("/follow/:id",isAuthenticated,followuser);

router.put("/update/password",isAuthenticated,updatePassword);
router.put("/update/profile",isAuthenticated,updateProfile);
router.delete("/delete/me",isAuthenticated,deleteMyprofile);
router.get("/me",isAuthenticated,myProfile);
router.get("/my/posts",isAuthenticated,getMyposts);
router.get("/userposts/:id",isAuthenticated,getUserposts);

router.get("/user/:id",isAuthenticated,getProfileofOthers);
router.get("/users",isAuthenticated,getAllUsers);
router.post("/forgot/password",forgetPassword);
router.put("/password/reset/:token",resetpassword);
export default router
