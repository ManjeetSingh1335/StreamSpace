import mongoose, {isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments=asyncHandler(async(req, res)=>{

    const {videoId}=req.params
    const {page=1, limit=10}=req.query

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }

    const video=await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video not found")
    }
    
    const pageNum=parseInt(page, 10);
    const limitNum=parseInt(limit, 10);

    const comments_aggregate=await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $lookup: {
                from : "users",
                localField: "owner",
                foreignField: "_id",
                as : "owner",
                piepline: [
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
                foreignField: "comment",
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

    const comments=await Comment.aggregatePaginate(comments_aggregate, {
        page: pageNum,
        limit: limitNum
    })

    return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"))
}); 

const addComment=asyncHandler(async(req, res)=>{

    const {videoId}=req.params
    const {content}=req.body

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }
    if(!content?.trim()){
        throw new ApiError(400, "Comment content is required")
    }
    const video=await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video not found!")
    }

    const comment=await Comment.create({
        content: content.trim(),
        video: videoId,
        owner: req.user?._id
    })
    if(!comment){
        throw new ApiError(500, "Failed to add comment")
    }

    return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully"))
});

const updateComment=asyncHandler(async(req, res)=>{

    const {commentId}=req.params
    const {content}=req.body

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid commentId")
    }
    if(!content?.trim()){
        throw new ApiError(400, "Comment content is required")
    }

    const comment=await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404, "Comment not found")
    }

    if(comment.owner.toString()!==req.user?._id.toString()){
        throw new ApiError(403, "You are not allowed to edit this comment")
    }
    
    const updatedComment=await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content: content.trim()
            }
        },
        {
            new: true
        }
    )

    if(!updatedComment){
        throw new ApiError(500, "Failed to update comment")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated successfully"))
});

const deleteComment=asyncHandler(async(req, res)=>{

    const {commentId}=req.params

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid commentId")
    }

    const comment=await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404, "Comment not found")
    }

    if(comment.owner.toString()!==req.user?._id.toString()){
        throw new ApiError(403, "You are not allowed to delete this comment")
    }

    await Comment.findByIdAndDelete(commentId)
    await Like.deleteMany(
        { 
            comment: commentId 
        }
    )

    return res
    .status(200)
    .json(new ApiResponse(200, {commentId}, "Comment deleted successfully"))
});

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}