import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Video} from "../models/video.model.js"
import {Comment} from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleVideoLike=asyncHandler(async(req, res)=>{

    const {videoId}=req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }

    const video=await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video not found")
    }

    const existing=await Like.findOne({
        video: videoId,
        likedBy: req.user?._id
    })
    if(existing){
        await Like.findByIdAndDelete(existing._id);
        return res
        .status(200)
        .json(new ApiResponse(200, {isLiked: false},  "Video unliked"))
    }

    await Like.create({
        video: videoId,
        likedBy: req.user?._id
    })

    return res
    .status(200)
    .json(new ApiResponse(200, {isLiked: true}, "Video liked"))

});

const toggleCommentLike=asyncHandler(async(req, res)=>{

    const {commentId}=req.params
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid commentId")
    }

    const comment=await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404, "Comment not found")
    }

    const existing=await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    })
    if(existing){
        await Like.findByIdAndDelete(existing._id);
        return res
        .status(200)
        .json(new ApiResponse(200, {isLiked: false},  "Comment unliked"))
    }

    await Like.create({
        comment: commentId,
        likedBy: req.user?._id
    })

    return res
    .status(200)
    .json(new ApiResponse(200, {isLiked: true}, "Comment liked"))
});

const toggleTweetLike=asyncHandler(async(req, res)=>{

    const {tweetId}=req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweetId")
    }

    const tweet=await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404, "Tweet not found")
    }

    const existing=await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id
    })
    if(existing){
        await Like.findByIdAndDelete(existing._id);
        return res
        .status(200)
        .json(new ApiResponse(200, {isLiked: false},  "Tweet unliked"))
    }

    await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id
    })

    return res
    .status(200)
    .json(new ApiResponse(200, {isLiked: true}, "Tweet liked"))
    
});

const getLikedVideos=asyncHandler(async(req, res)=>{

    const {page=1, limit=10}=req.query;
    const pageNum=parseInt(page, 10);
    const limitNum=parseInt(limit, 10);

    const likedVideos=await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
                video: {
                    $exists: true, 
                    $ne: null
                },
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    { 
                        $match: { 
                            isPublished: true 
                        } 
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                { 
                                    $project: { 
                                        username: 1, 
                                        fullName: 1, 
                                        avatar: 1 
                                    } 
                                },
                            ],
                        },
                    },
                    { 
                        $addFields: { 
                            owner: { 
                                $first: "$owner" 
                            } 
                        } 
                    },
                ],
            },
        },
        { 
            $unwind: "$video" 
        },
        { 
            $replaceRoot: { 
                newRoot: "$video" 
            } 
        },
        {
            $skip: (pageNum-1)*limitNum
        },
        {
            $limit: limitNum
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"));
});


export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}