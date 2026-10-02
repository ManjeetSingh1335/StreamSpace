import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteOnCloudinary} from "../utils/cloudinary.js"

const getAllVideos=asyncHandler(async(req, res)=>{

    const {page = 1, limit = 10, query, sortBy, sortType, userId}=req.query

    const pipeline=[];

    if(query){
        pipeline.push({
            $match: {
                $or: [
                    {
                        title: {
                            $regex: query, 
                            $options: "i"
                        }
                    },
                    {
                        description: {
                            $regex: query, 
                            $options: "i"
                        }
                    }
                ]
            }
        })
    }

    if(userId){
        if(!isValidObjectId(userId)){
            throw new ApiError(400, "Invalid User ID Format")
        }

        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId) 
            }
        })
    }

    pipeline.push({
        $match: {
            isPublished: true
        }
    });

    const sortField=sortBy || "createdAt"
    const sortOrder=sortType==="asc"? 1 : -1
    pipeline.push({
        $sort: {
            [sortField]: sortOrder
        }
    })

    pipeline.push({
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner"
       }
    });

    pipeline.push({
        $addFields: {
            owner: {
                $first: "$owner"
            }
        }
    });

    pipeline.push({
        $project: {
            videoFile: 1,
            thumbnail: 1,
            title: 1,
            description: 1,
            duration: 1,
            views: 1,
            isPublished: 1,
            createdAt: 1,
            updatedAt: 1,
            "owner.username": 1,
            "owner.fullName": 1,
            "owner.avatar": 1
        }
    });


    const options={
        page: Number(page),
        limit: Number(limit)
    };

    const videoAggregate=Video.aggregate(pipeline)
    const videos=await Video.aggregatePaginate(videoAggregate, options)

    return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos Fetched Successfully"))
});

const publishAVideo=asyncHandler(async(req, res)=>{
    
    const {title, description}=req.body

    if([title, description].some((field) => !field || field?.trim()==="")){
        throw new ApiError(400, "Title and description are required")
    }

    const videoFileLocalPath=req.files?.videoFile?.[0]?.path
    const thumbnailLocalPath=req.files?.thumbnail?.[0]?.path

    if(!videoFileLocalPath){
        throw new ApiError(400, "Video file is required")
    }
    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail is required")
    } 

    const [videoFile, thumbnail]=await Promise.all([
        uploadOnCloudinary(videoFileLocalPath),
        uploadOnCloudinary(thumbnailLocalPath)
    ])

    if(!videoFile || !thumbnail){
        if(videoFile){
            await deleteOnCloudinary(videoFile.url, "video")
        }
        if(thumbnail){
            await deleteOnCloudinary(thumbnail.url, "image")
        }
        throw new ApiError(500, "Failed to upload video or thumbnail")
    }

    let video;
    try{
        video=await Video.create({
            title,
            description,
            duration:videoFile.duration,
            videoFile: videoFile.url,
            thumbnail: thumbnail.url,
            owner: req.user?._id,
            isPublished: true
        })
    }catch(error){
        await deleteOnCloudinary(videoFile.url, "video")
        await deleteOnCloudinary(thumbnail.url, "image")
        throw new ApiError(500, "Something went wrong while saving the video")
    }

    const uploadedVideo=await Video.findById(video._id)

    if(!uploadedVideo){
        await deleteOnCloudinary(videoFile.url, "video")
        await deleteOnCloudinary(thumbnail.url, "image")
        throw new ApiError(500, "Something went wrong while publishing the video")
    }
    
    return res
    .status(200)
    .json(new ApiResponse(200, uploadedVideo, "Video Uploaded Successfully"))
});

const getVideoById=asyncHandler(async(req, res)=>{

    const {videoId}=req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video ID Format")
    }

    const video=await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
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
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: {
                                $size: "$subscribers"
                            },
                            isSubscribed: {
                                $cond: {
                                    if: {$in: [new mongoose.Types.ObjectId(req.user?._id), "$subscribers.subscriber"]},
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                            subscribersCount: 1,
                            isSubscribed: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                owner: 1,
                createdAt: 1,
                updatedAt: 1
            }
        }
    ]);

    if(!video?.length){
        throw new ApiError(404, "Video not found")
    }
    await Video.findByIdAndUpdate(videoId, {
        $inc: {views: 1}
    })

    if(req.user?._id){
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { watchHistory: videoId }
        })
        await User.findByIdAndUpdate(req.user._id, {
            $push: { watchHistory: videoId }
        })
    }

    return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video fetched successfully"))
});

const updateVideo=asyncHandler(async(req, res)=>{

    const {videoId}=req.params
    const {title, description}=req.body
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video ID Format")
    }
    if(!title?.trim() && !description?.trim() && !req.file){
        throw new ApiError(400, "At least one field is required to update")
    }
     
    const video=await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video not found")
    }

    if(video.owner.toString()!==req.user?._id.toString()){
        throw new ApiError(403, "You are not authorized to update this video")
    }

    const updateFields={}
    
    if(title?.trim()){
        updateFields.title=title
    }
    if(description?.trim()){
        updateFields.description=description
    }
    const thumbnailLocalPath=req.file?.path
    let newThumbnail
    if(thumbnailLocalPath){

        newThumbnail=await uploadOnCloudinary(thumbnailLocalPath)
        if(!newThumbnail?.url){
            throw new ApiError(500, "Failed to upload new thumbnail")
        }
        updateFields.thumbnail=newThumbnail.url
    }

    const updatedVideo=await Video.findByIdAndUpdate(videoId,
        {
            $set: updateFields
        },
        {
            new: true
        }
    )
    if(!updatedVideo){
        if(newThumbnail){
            await deleteOnCloudinary(newThumbnail.url, "image")
        }
        throw new ApiError(500, "Something went wrong while updating the video")
    }

    if(newThumbnail){
        await deleteOnCloudinary(video.thumbnail, "image")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"))
});

const deleteVideo=asyncHandler(async(req, res)=>{

    const {videoId}=req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video ID Format")
    }

    const video=await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video not found")
    }

    if(video.owner.toString()!==req.user?._id.toString()){
        throw new ApiError(403, "You are not authorized to delete this video")
    }

    const deletedVideo=await Video.findByIdAndDelete(videoId)
    if(!deletedVideo){
        throw new ApiError(500, "Something went wrong while deleting the video")
    }

    await deleteOnCloudinary(video.videoFile, "video")
    await deleteOnCloudinary(video.thumbnail, "image")

    await User.updateMany(
        {
            watchHistory: videoId
        },
        {
            $pull: {
                watchHistory: videoId
            }
        }
    )

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"))
});

const togglePublishStatus=asyncHandler(async(req, res)=>{

    const {videoId}=req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video ID Format")
    }

    const video=await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video not found")
    }
    if(video.owner.toString()!==req.user?._id.toString()){
        throw new ApiError(403, "You are not authorized to update this video")
    }

    const updatedVideo=await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video.isPublished
            }
        },
        {
            new: true
        }
    )
    if(!updatedVideo){
        throw new ApiError(500, "Something went wrong while toggling publish status")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo,   `Video ${updatedVideo.isPublished ? "published" : "unpublished"} successfully`))
});

export {
    getAllVideos, 
    publishAVideo, 
    getVideoById, 
    updateVideo,
    deleteVideo,
    togglePublishStatus
}