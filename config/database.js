import mongoose from "mongoose";

export const connectDb=()=>{ mongoose.connect(process.env.MONGO_URI,{
dbName:"SocialMediaApp" 
}).then(()=>{
  console.log("data base connected")})
.catch((e)=>{
  console.log(e);
}) }



