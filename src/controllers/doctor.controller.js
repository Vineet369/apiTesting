import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {Doctor} from '../models/doctor.models.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken"


const generateAccessAndRefreshToken = async (doctorId) =>{
    try {
        const doctor = await Doctor.findById(doctorId)
        const accessToken = doctor.generateAccessToken()
        const refreshToken = doctor.generateRefreshToken()

        doctor.refreshToken = refreshToken
        await doctor.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token")
        
    }

} 

const registerDoctor = asyncHandler(async (req, res) => {


    const { doctorName, email, speciality, contact, profileImageURL, password } = req.body

    // check validation, not empty

    // if(
    //     [doctorName, email, speciality, contact, profileImageURL, password].some((field) =>
    //     field?.trim()==="")
    // ) {
    //     throw new ApiError(400, "All fields are required")
    // }

    // check if doctor already exists: doctorName , email

    const existeddoctor = await Doctor.findOne({
        $or: [{doctorName}, {email}]
    })

    if ( existeddoctor ){
        throw new ApiError(409, "doctor with doctorName or email already exists")
    }

    // create doctor object - create entry in database

    const doctor = await Doctor.create({
        doctorName,
        email,
        password,
        contact, 
        speciality,  
        profileImageURL,
    })

    // check for doctor cretion

    const createddoctor = await Doctor.findById(doctor._id).select(
        "-password -refreshToken"
    )

    if (!createddoctor) {
        throw new ApiError(500, "Something went wrong while registering the doctor")
    }

    // return res

    return res.status(201).json(
        new ApiResponse(200, createddoctor, "doctor registered successfully")
    )

})

const loginDoctor = asyncHandler(async (req, res) => {

    const {email, password} = req.body

    if (!(email)){
        throw new ApiError(400, "doctorName or email is required");
    }

    const doctor = await Doctor.findOne({
        $or: [{email}]
    })

    if (!doctor){
        throw new ApiError(404, "doctor not found")
    }

    const isPasswordValid = await doctor.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid doctor credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(doctor._id)

    const loggedIndoctor = await Doctor.findById(doctor._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                doctor: loggedIndoctor, accessToken, refreshToken
            },
            "doctor logged in successfully"
        )
    )

})

const logoutDoctor = asyncHandler(async (req, res) => {
    Doctor.findByIdAndUpdate(req.doctor._id,
        {
            $set: {
                refreshToken: undefined
            }
        },{
            new: true
        })
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "doctor logged out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if (incomingRefreshToken){
        throw new ApiError("401", "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const doctor = await Doctor.findById(decodedToken?._id)
    
        if (!doctor){
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== doctor?.refreshToken){
            throw new ApiError(401, "Refresh token expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(doctor._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token") 
    }

})




export {registerDoctor,
        loginDoctor,
        logoutDoctor, 
        refreshAccessToken, 
}