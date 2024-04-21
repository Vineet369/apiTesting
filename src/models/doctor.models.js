import mongoose, {Schema} from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const doctorSchema = new Schema({
  doctorName: {
    type: String,
    required: true,
  },  
  speciality: {
    type: String, 
    required: true,
  },  
  email: {
    type: String, 
    unique: true,
  },
  contact: {
    type: Number, 

  },

  password: {
    type: String,
  },
  profileImageURL: {
    type: String,
    default: './public/images/user-avatar.png',
  },
  role: {
    type: String,
    enum: ['DOCTOR', 'USER'],
    default: "DOCTOR",
  },
}, {timestamps: true}
);

doctorSchema.pre("save", async function(next) {
    if (!this.isModified("password")) 
        return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

doctorSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

doctorSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id: this._id,
        email: this.email,
        doctorName: this.doctorName
    },
    process.env.ACCESS_TOKEN_SECRET,{
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    })
}

doctorSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id: this._id,
        
    },
    process.env.REFRESH_TOKEN_SECRET,{
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    })
}


export const Doctor = mongoose.model("Doctor", doctorSchema)