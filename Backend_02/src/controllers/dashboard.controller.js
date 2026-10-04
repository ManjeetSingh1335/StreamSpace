import mongoose, { isValidObjectId } from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats=asyncHandler(async(req, res)=>{
    const requesterId=req.user?._id
    if(!requesterId){
        throw new ApiError(401, "Unauthorized request")
    }

    const targetId=req.params.channelId ?? requesterId.toString()
    if(!isValidObjectId(targetId)){
        throw new ApiError(400, "Invalid channelId")
    }

    const channelId=new mongoose.Types.ObjectId(targetId)
    const isOwner=channelId.equals(requesterId)

    const channelExists=await User.exists({ _id: channelId })
    if(!channelExists){
        throw new ApiError(404, "Channel not found")
    }

    const [videoStats, totalSubscribers]=await Promise.all([
        Video.aggregate([
            {
                $match: {
                    owner: channelId,
                    ...(isOwner? {} : {isPublished: true})
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    pipeline: [
                        { 
                            $count: "count" 
                        }
                    ],
                    as: "likes"
                }
            },
            {
                $group: {
                    _id: null,
                    totalVideos: {
                        $sum: 1
                    },
                    totalViews: {
                        $sum: "$views"
                    },
                    totalLikes: {
                        $sum: { 
                            $ifNull: [{$first: "$likes.count"}, 0] 
                        }
                    }
                }
            }
        ]),
        Subscription.countDocuments(
            { 
                channel: channelId 
            }
        )
    ])

    const stats={
        totalVideos: videoStats[0]?.totalVideos ?? 0,
        totalViews: videoStats[0]?.totalViews ?? 0,
        totalLikes: videoStats[0]?.totalLikes ?? 0,
        totalSubscribers
    }

    return res
    .status(200)
    .json(new ApiResponse(200, stats, "Channel stats fetched successfully"))
})

const getChannelVideos=asyncHandler(async(req, res)=>{

    const userId=req.user?._id
    if(!userId){
        throw new ApiError(401, "Unauthorized request")
    }

    const {page=1, limit=10, sortBy="createdAt", sortType="desc"}=req.query

    const pageNum=Math.max(parseInt(page, 10) || 1, 1)
    const limitNum=Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50)

    const allowedSortFields=["createdAt", "views", "title", "duration"]
    const sortField=allowedSortFields.includes(sortBy)? sortBy:"createdAt" 
    const sortOrder=sortType === "asc"? 1:-1

    const aggregate=Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $sort: {
                [sortField]: sortOrder
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                pipeline: [
                    { 
                        $count: "count" 
                    }
                ],
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: {
                    $ifNull: [{$first: "$likes.count"}, 0]
                }
            }
        },
        {
            $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,
                likesCount: 1
            }
        }
    ])

    const videos=await Video.aggregatePaginate(aggregate, {
        page: pageNum,
        limit: limitNum
    })

    return res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel videos fetched successfully"))
});

export {
    getChannelStats, 
    getChannelVideos
}   