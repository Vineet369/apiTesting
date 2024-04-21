import {Router} from 'express';
import { registerDoctor,
    loginDoctor,
    logoutDoctor, 
    refreshAccessToken,  } from "../controllers/doctor.controller.js";
import { verifyJWT } from '../middlewares/auth.middleware.js';
const router = Router()

router.route("/register").post(
   
    registerDoctor
)

router.route("/login").post(loginDoctor)

//secure route
router.route("/logout").post(verifyJWT, logoutDoctor)
router.route("/refresh-token").post(refreshAccessToken)
// router.route("/change-password").post(verifyJWT, changeCurrentPassword)
// router.route("/current-user").get(verifyJWT, getCurrentUser)
// router.route("update-account").patch(verifyJWT, UpdateAccountDetails)

// router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
// router.route("cover-image").patch(verifyJWT, upload.single("/coverImage"), updateUserCoverImage)
// router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
// router.route("/history").get(verifyJWT, getWatchHistory)


export default router;