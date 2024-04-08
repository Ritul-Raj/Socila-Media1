import { trusted } from "mongoose";
import { Post } from "../models/Post.js"
import { User } from "../models/User.js";

import cloudinary from "cloudinary";

export const createPost=async(req,res)=>{

    try {

    const myCloud=await cloudinary.v2.uploader.upload(req.body.image,{
     folder:"posts",    
    });
    
        const newpostdata={
            caption:req.body.caption,
            image:{
                public_id:myCloud.public_id,
                url:myCloud.secure_url,
            } ,
            owner:req.user._id,
        }
        

        const newpost=await Post.create(newpostdata);
         const user=await User.findById(req.user._id);
        //  user.posts.push(newpost._id); 
         user.posts.unshift(newpost._id); // unshift sai starting maii sttore hota haii

         await user.save();

        res.status(201).json({
            success:true,
            message:"Post Created"
            // post:newpost
        })
    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
}



export const LikeandUnlikePost=async(req,res)=>{
 try {
    const post=await Post.findById(req.params.id);
    if(!post){
        return res.status(404).json({
            success:false,
            message:"Post Not Found"
        })
    }


if(post.likes.includes(req.user._id)) {
    const index=post.likes.indexOf(req.user._id);
    post.likes.splice(index,1); // remove from array
    await post.save();
    return res.status(200).json({
        success:true,
        message:"Post Unliked"
    })
}
else{
    post.likes.push(req.user._id);
    await post.save();
    return res.status(200).json({
        success:true,
        message:"Post liked"
    })
}

 } catch (error) {
    res.status(500).json({
        success:false,
        message:error.message
    })
 }
}


export const DeletePost=async(req,res)=>{
    const post=await Post.findById(req.params.id);
try {
  
    if(!post){
        return res.status(404).json({
            success:false,
            message:"Post Not Found"
        })
    }

if(post.owner.toString()!==req.user._id.toString()){
    return res.status(401).json({
        success:false,
        message:"UnAuthorized"
    })
}
await cloudinary.v2.uploader.destroy(post.image.public_id);
await post.deleteOne();
const user=await User.findById(req.user._id);

const index=user.posts.indexOf(req.params.id);

user.posts.splice(index,1);
await user.save();

res.status(200).json({
    success:true,
    message:"Post Deleted"
})

} catch (error) {
    res.status(500).json({
        success:false,
        message:error.message
    })
}
}



export const getPostOfFollowing=async(req,res)=>{
try {
  const user =await User.findById(req.user._id) ; 
  const posts=await Post.find({
    owner:{
        $in:user.followings,
    },
  }).populate("owner likes comments.user") 

   res.status(200).json({
    success:true,
    posts:posts.reverse()
   })


} catch (error) {
    res.status(500).json({
     success:false,
     message:error.message   
    })
}

}

export const updateCaption=async(req,res)=>{
    try {
        const post=await Post.findById(req.params.id)
        if(!post){
         return res.status(404).json({
            success:false,
            message:"Post Not Found"
         })
        }
if(post.owner.toString()!==req.user._id.toString()){
    return res.status(401).json({
        success:false,
        message:"Unauthorized"
    })
}
post.caption=req.body.caption;
await post.save();
res.status(200).json({
    success:true,
    message:"Cpation Updated"

})

    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message   
           })
    }
}

export const addComment=async(req,res)=>{
    try {
        const post =await Post.findById(req.params.id);
       
        if(!post){
            return res.status(404).json({
                success:false,
                message:"Post Not Found"
            })
        }
      let commentIndex=-1;

      //checkiing if comment Prevoiusly Exist

      post.comments.forEach((item,index)=>{
        if(item.user.toString()===req.user._id.toString()){
            commentIndex=index;
        }
      });

        if(commentIndex!==-1){
       post.comments[commentIndex].comment=req.body.comment;
       await post.save();
       return res.status(200).json({
         success:true,
         message:"Comment Updated"
       })
        } 
        else{
            post.comments.push({
               user:req.user._id,
               comment:req.body.comment,
         })
         await post.save();
         return res.status(200).json({
            success:true,
            message:"Comment Addedd"
         })
        } 
  
    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message   
           })
    }
}

export const deleteComment=async(req,res)=>{
try {
    const post =await Post.findById(req.params.id);
    if(!post){
        return res.status(404).json({
            success:false,
            message:"Post Not Found"
        })
    }
   /// owner koi bhi comment delete kr skta haiii
    if(post.owner.toString()===req.user._id.toString()){
   if(req.body.commentid==undefined){
    return res.status(400).json({
        success:false,
        message:"Comment Id Is Required"
    })
   }

        post.comments.forEach((item,index)=>{
            if(item._id.toString()===req.body.commentid.toString()){
                return  post.comments.splice(index,1);
            }
          });

          await post.save();
          return res.status(200).json({
            success:true,
            message:"Selected Comment Deleted"
          })
    }
    else{
        post.comments.forEach((item,index)=>{
            if(item.user.toString()===req.user._id.toString()){
                return  post.comments.splice(index,1);
            }
          });
await post.save();
return res.status(200).json({
    success:true,
    message:"Your Comment Has Deleted"
})
    }

} catch (error) {
    res.status(500).json({
        success:false,
        message:error.message   
       })
}
}




