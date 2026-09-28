import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import {Subscription} from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleSubscription=asyncHandler(async(req, res)=>{

    const {channelId}=req.params;

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channelId");
    }

    const channel=await User.findById(channelId)
    if(!channel){
        throw new ApiError(404, "Channel does not exist")
    }

    if(channelId===req.user._id.toString()){
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }

    const existing=await Subscription.findOne({
        channel: channelId,
        subscriber: req.user?._id
    })
    if(existing){
        await Subscription.findByIdAndDelete(existing._id)
        return res
        .status(200)
        .json(new ApiResponse(200, {subscribed: false}, "Unsubscribed successfully"))
    }

    await Subscription.create({
        channel: channelId,
        subscriber: req.user?._id
    })

    return res
    .status(200)
    .json(new ApiResponse(200, {subscribed: true}, "Subscribed successfully"))
});

const getSubscribedChannels=asyncHandler(async(req, res)=>{

    const {subscriberId}=req.params;

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "Invalid subscriberId");
    }

    const subscribedChannels=await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$channel"
        },
        {
            $project: {
                _id: 0,
                channel: 1,
                subscribedAt: "$createdAt"
            }
        },
        {
            $sort: { 
                subscribedAt: -1 
            } 
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, subscribedChannels, "Subscribed channels fetched successfully"))
});
        
const getUserChannelSubscribers=asyncHandler(async(req, res)=>{

    const {channelId}=req.params;
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel ID");
    }

    const subscribers=await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$subscriber"
        },
        {
            $project: {
                _id: 0,
                subscriber: 1,
                subscribedAt: "$createdAt",
            },
        },
        {
            $sort: { 
                subscribedAt: -1
            }  
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200,subscribers,"Channel subscribers fetched successfully"));
});

const isSubscribed=asyncHandler(async(req, res)=>{

    const{channelId}=req.params;
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel ID");
    }

    const subscription=await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId,
    });

    return res
    .status(200)
    .json(new ApiResponse(200,{isSubscribed: !!subscription},"Subscription status fetched successfully"));
});


export {
    toggleSubscription, 
    getUserChannelSubscribers,
    getSubscribedChannels,
    isSubscribed
}