import {Router} from 'express';
import {
    getVideoComments,
    updateComment,
    addComment,
    deleteComment,
    getTweetComments,
    addTweetComment
} from "../controllers/comment.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT); 

router.route("/:videoId").get(getVideoComments).post(addComment);
router.route("/t/:tweetId").get(getTweetComments).post(addTweetComment);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);

export default router