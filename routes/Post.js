import express  from "express";
import { addComment, createPost, deleteComment, getPostOfFollowing, updateCaption } from "../Controllers/Post.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { LikeandUnlikePost } from "../Controllers/Post.js";
import { DeletePost } from "../Controllers/Post.js";
const router=express.Router();

router.post("/post/upload",isAuthenticated,createPost)
router.get("/post/:id",isAuthenticated,LikeandUnlikePost)
router.put("/post/:id",isAuthenticated,updateCaption)
router.delete("/post/:id",isAuthenticated,DeletePost)
router.get("/posts",isAuthenticated,getPostOfFollowing)
router.put("/post/comment/:id",isAuthenticated,addComment)
router.delete("/post/comment/:id",isAuthenticated,deleteComment)


export default router

