import { User } from "../models/User.js"
import { Post } from "../models/Post.js";
import { sendEmail } from "../middlewares/sendEmail.js";
import crypto from "crypto";
import cloudinary from "cloudinary";

export const register=async(req,res)=>{
    try {
        const {name,email,password,avatar}=req.body;
        let user=await User.findOne({email});
        if(user){
            return res.status(400).json({success:false ,message:"User Already Exist"})
        }
      const myCloud=await cloudinary.v2.uploader.upload(avatar,{folder:"avatars"});

        user= await User.create({name,email,password,
        avatar:{public_id:myCloud.public_id,url:myCloud.secure_url}})

        const token=await user.generatetoken();

        res.status(201).cookie("token",token,{
            expires:new Date(Date.now()+90*24*60*60*1000),
            httpOnly:true
        }).json({
            success:true,
            user
            
        })

    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}

export const login= async(req,res)=>{
try {
    const {email,password}=req.body;
    let user=await User.findOne({email}).select("+password").populate("posts followers followings");
    if(!user){
        return res.status(400).json({success:false ,message:"User Does Not Exist"})
    }
    
    const ismatch=await user.matchpassword(password);

    if(!ismatch){
        return res.status(400).json({
         success:false,
         message:"Incorrect Password"
        })
    }
    const token=await user.generatetoken();

    res.status(200).cookie("token",token,{
        expires:new Date(Date.now()+90*24*60*60*1000),
        httpOnly:true
    }).json({
        success:true,
        message:"Logged IN succcessfully",
        user
        
    })
    
} catch (error) {
    res.status(500).json({
        success:false,
        message:error.message,
    });
}
}


export const logout=async(req,res)=>{
    try {
        res.status(200).cookie("token",null,{
            expires:new Date(Date.now()),httpOnly:true 
        }).json({
            success:true,
            message:"Logged Out"
        })
    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message,
        });
    }
}
  

export const followuser=async(req,res)=>{
    try {
        const usertofollow=await User.findById(req.params.id);
        const loggedinuser=await User.findById(req.user._id);

       if(!usertofollow){
        return res.status(404).json({
            success:false,
            message:"User Not Found"
        })
       }

if(loggedinuser.followings.includes(usertofollow._id)){
    console.log("yes");
   const indexfollowing=loggedinuser.followings.indexOf(usertofollow._id);
   const indexfollowers=usertofollow.followers.indexOf(loggedinuser._id);

    loggedinuser.followings.splice(indexfollowing,1);
    usertofollow.followers.splice(indexfollowers,1);

    await loggedinuser.save();
    await usertofollow.save();
    res.status(200).json({
        success:true,
        message:"User UNFollowed"
    })
}
else{
    loggedinuser.followings.push(usertofollow._id);
    usertofollow.followers.push(loggedinuser._id);
    
    await loggedinuser.save();
    await usertofollow.save();

    res.status(200).json({
        success:true,
        message:"User Followed"
    })
}


    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
    } 

export const updatePassword=async(req,res)=>{
try {
    const user=await User.findById(req.user._id).select("+password");
    const{oldPassword,newPassword}=req.body;
    if(!oldPassword || !newPassword){
        return res.status(400).json({
            success:false,
            message:"Please Provide Old and New Password"
        })
    }
    const isMatch= await user.matchpassword(oldPassword);
    if(!isMatch){
        return res.status(400).json({
            success:false,
            message:"Incorrect Old Password"
        })
    }    
  user.password=newPassword;
  await user.save();
  res.status(200);
  res.json({
    success:true,
    message:"PassWord Updated"
  })

} catch (error) {
    res.status(500).json({
        success:false,
        message:error.message
    })
}
}

export const updateProfile=async(req,res)=>{
try {
    const user =await User.findById(req.user._id);

    const {name,email,avatar}=req.body;

    if(name){
        user.name=name;
    }
    if(email){
        user.email=email;
    }
    if(avatar){
        await cloudinary.v2.uploader.destroy(user.avatar.public_id)
    const myCloud=await cloudinary.v2.uploader.upload(avatar,{folder:"avatars"})
    user.avatar.public_id=myCloud.public_id;
    user.avatar.url=myCloud.secure_url
    }
   await user.save();
   res.status(200).json({
    success:true,
    message:"Profile Updated"
   })

} catch (error) {
    res.status(500).json({
        success:false,
        message:error.message
    })
}
}


export const deleteMyprofile=async(req,res)=>{
try {
    const user=await User.findById(req.user._id);
   const posts=user.posts;
   const followers=user.followers;
   const following=user.followings
   const userId=user._id;
   //removing photos from cloudinary
   await cloudinary.v2.uploader.destroy(user.avatar.public_id)
   await user.deleteOne();

//Logout User after Deleting Profile
res.cookie("token",null,{
    expires:new Date(Date.now()),httpOnly:true 
})


   // Delete All post associated with the user
   for(let i=0;i<posts.length;i++){
    const post=await Post.findById(posts[i]);
    await cloudinary.v2.uploader.destroy(post.image.public_id)

    await post.deleteOne();
   }

// Removing User from following list of other(follower ka)
for(let i=0;i<followers.length;i++){
    const follower= await User.findById(followers[i]);
    const index=follower.followings.indexOf(userId);
    follower.followings.splice(index,1);
    await follower.save();
}

//Removing User from Followers list of other(Follower ka)
for(let i=0;i<followers.length;i++){
    const follows= await User.findById(following[i]);
    const index=follows.followers.indexOf(userId);
    follows.followers.splice(index,1);
    await follows.save();
}

//Removing all comments of user where he/she comments on other posts
const allPosts = await Post.find();

for (let i = 0; i < allPosts.length; i++) {
  const post = await Post.findById(allPosts[i]._id);

  for (let j = 0; j < post.comments.length; j++) {
    if (post.comments[j].user === userId) {
      post.comments.splice(j, 1);
    }
    await post.save();
  }
  
}
// removing all likes of the user from all posts

for (let i = 0; i < allPosts.length; i++) {
  const post = await Post.findById(allPosts[i]._id);

  for (let j = 0; j < post.likes.length; j++) {
    if (post.likes[j] === userId) {
      post.likes.splice(j, 1);
    }
  }
  await post.save();
}

   res.status(200).json({
    success:true,
    message:"Profile Deleted"
})
    
} catch (error) {
    res.status(500).json({
        success:false,
        message:error.message
    })
}
}

export const myProfile=async(req,res)=>{
    try {
        const user=await User.findById(req.user._id).populate("posts followers followings");
        res.status(200).json({
            success:true,
            user,
        })
    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

export const getProfileofOthers=async(req,res)=>{
try {
    const user=await User.findById(req.params.id).populate("posts followers followings")
    if(!user){
        return res.status(404).json({
            success:true,
            message:"user Not Found"
        })
    }

    res.status(200).json({
        success:true,
        user
    })
} catch (error) {
    res.status(500).json({
        success:false,
        message:error.message
    })
}
}

export const getAllUsers=async(req,res)=>{
    try {
        const users=await User.find({name:{$regex :req.query.name,$options:"i"}});

        res.status(200).json({
            success:true,
            users
        })
    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
}
    
export const forgetPassword=async(req,res)=>{
    try {
        // console.log("yyy")
        const {email}=req.body;
        
        const user=await User.findOne({email});

        // console.log(email)
   if(!user){
    res.status(404).json({
   success:false,
   message:"User Not Found"
    });
       }

const resetPasswordToken = await user.getResetPasswordToken();
       await user.save();

const resetUrl=`${req.protocol}://${req.get("host")}/password/reset/${resetPasswordToken}`;
       
const message=`Reset your password by clicking ont the link below:\n\n ${resetUrl}`;

 try {
    await sendEmail({            
        email:user.email,
        subject:"Reset Password",
        message,
    });                           

    res.status(200).json({
        success:true,
        message:`Email sent to ${user.email}`,

    })
 } 
 catch (error) {
    user.resetPasswordToken=undefined
    user.resetPasswordExpire=undefined
    await user.save();

    res.status(500).json({
        success:false,
        // message:"hjhjh",
         message:error.message
    })
 }

    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

export const resetpassword=async(req,res)=>{
    try {
        
        const resetPasswordToken= crypto.createHash("sha256").update(req.params.token).digest("hex");
     const user=await User.findOne({
        resetPasswordToken,
        resetPasswordExpire:{$gt:Date.now()},
     })

     if(!user){
        return res.status(401).json({
            success:false,
            message:"Token Invalid or has Expired"
        })
     }

user.password=req.body.password;
user.resetPasswordToken=undefined
user.resetPasswordExpire=undefined
await user.save();
res.status(200).json({
    success:true,
    message:"new Password Updated"
})

    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
}



export const getMyposts=async(req,res)=>{
try {
  const user=await User.findById(req.user._id);
  const posts=[];
  for(let i=0;i<user.posts.length;i++){
    const post=await Post.findById(user.posts[i]).populate("owner likes comments.user")
    posts.push(post);
  }
  res.status(200).json({
    success:true,
    posts
})

} catch (error) {
    res.status(500).json({
        success:false,
        message:error.message
    })
}
}

export const getUserposts=async(req,res)=>{
    try {
      const user=await User.findById(req.params.id);
      const posts=[];
      for(let i=0;i<user.posts.length;i++){
        const post=await Post.findById(user.posts[i]).populate("owner likes comments.user")
        posts.push(post);
      }
      res.status(200).json({
        success:true,
        posts
    })
    
    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
    }