import mongoose, {isValidObjectId} from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet=asyncHandler(async(req, res)=>{
    
    const {content}=req.body
    if(!content?.trim()){
        throw new ApiError(400, "Tweet content is required")
    }

    const tweet=await Tweet.create({
        content: content.trim(),
        owner: req.user?._id
    })

    if(!tweet){
        throw new ApiError(500, "Failed to create tweet")
    }

    return res
    .status(201)
    .json(new ApiResponse(201, tweet, "Tweet Created Successfully"))
});

const getUserTweets=asyncHandler(async(req, res)=>{

    const {userId}=req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid userId")
    }

    const user=await User.findById(userId)
    if(!user){
        throw new ApiError(404, "User not found")
    }

    const tweets=await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $sort: {
                createdAt: -1
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
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes"
            }
        },
        {
            $addFields: {
                owner: { 
                    $first: "$owner" 
                },
                likesCount: { 
                    $size: "$likes" 
                },
                isLiked: {
                    $in: [
                        new mongoose.Types.ObjectId(req.user?._id),
                        "$likes.likedBy"
                    ]
                }
            }
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, tweets, "User tweets fetched successfully"))
});

const updateTweet=asyncHandler(async(req, res)=>{

    const {tweetId}=req.params
    const {content}=req.body

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweetId")
    }
    if(!content?.trim()){
        throw new ApiError(400, "Tweet content is required")
    }

    const tweet=await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404, "Tweet not found")
    }

    if(tweet.owner.toString()!==req.user?._id.toString()){
        throw new ApiError(403, "You are not authorized to update this tweet")
    }

    const updatedTweet=await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content: content.trim()
            }
        },
        {
            new: true
        }
    )

    if(!updatedTweet){
        throw new ApiError(500, "Failed to update tweet")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"))
});

const deleteTweet=asyncHandler(async(req, res)=>{

    const {tweetId}=req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweetId")
    }

    const tweet=await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404, "Tweet not found")
    }


    if(tweet.owner.toString()!==req.user?._id.toString()){
        throw new ApiError(403, "You are not allowed to delete this tweet")
    }

    await Tweet.findByIdAndDelete(tweetId)
    await Like.deleteMany(
        { 
            tweet: tweetId 
        }
    )

    return res
    .status(200)
    .json(new ApiResponse(200, {tweetId}, "Tweet deleted successfully"))
});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}