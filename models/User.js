import mongoose from "mongoose";
import bcrypt from "bcrypt"
import Jwt  from "jsonwebtoken";
import crypto from "crypto";

const userSchema=new mongoose .Schema({
name:{
    type:String,
    required:[true,"please enter a name"]
},
avatar:{
public_id:String,
url:String
},
email:{
    type:String,
    required:true,
    unique:[true,"Email Already Exists"]
}
,
password:{
    type:String,
    required:[true,"please enter a password"],
  minlength:[6,"Password must be a 6 Characters"],
  select :false
},
posts:[
    {
    type:mongoose.Schema.Types.ObjectId,
    ref:"Post"
},
],
followers:[
    {
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
}
],
followings:[
    {
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
}
],
resetPasswordToken:String ,
resetPasswordExpire:Date,
 
});



userSchema.pre("save",async function(next){
    if(this.isModified("password")){
        this.password=await bcrypt.hash(this.password,10);
    }
    next();
}) ;

userSchema.methods.matchpassword=async function (password){
    return await bcrypt.compare(password,this.password);
}
userSchema.methods.generatetoken=async function (){
    return Jwt.sign({_id:this._id},process.env.JWT_SECRET) ;
}

userSchema.methods.getResetPasswordToken=async function(){
const resetToken=crypto.randomBytes(20).toString("hex");
// console.log(resetToken)
this.resetPasswordToken=crypto.createHash("sha256").update(resetToken).digest("hex");
this.resetPasswordExpire=Date.now() + 10*20*1000;
 
return resetToken;

}   

export const User=mongoose.model("User",userSchema)
