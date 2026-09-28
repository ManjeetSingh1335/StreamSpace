import {Router} from "express"
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
    isSubscribed
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router=Router();
router.use(verifyJWT);

router.route("/c/:channelId")
.get(getUserChannelSubscribers)
.post(toggleSubscription);

router.route("/u/:subscriberId").get(getSubscribedChannels);
router.route("/c/:channelId/status").get(isSubscribed);

export default router