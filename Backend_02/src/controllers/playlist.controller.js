import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist=asyncHandler(async(req, res)=>{

    const {name, description}=req.body
    if(!name?.trim()){
        throw new ApiError(400,"Playlist name is required")
    }
    if(!description?.trim()){
        throw new ApiError(400,"Playlist description is required")
    }

    const existing=await Playlist.findOne({
        name: name.trim(),
        owner: req.user?._id
    })
    if(existing){
        throw new ApiError(409, "You already have a playlist with this name")
    }


    const playlist=await Playlist.create({
        name: name.trim(),
        description: description.trim(),
        videos: [],
        owner: req.user?._id
    })
    
    if(!playlist){
        throw new ApiError(500, "Failed to create playlist")
    }

    return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist Created Successfully"))

});

const getUserPlaylists=asyncHandler(async(req, res)=>{

    const {userId}=req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid userId")
    }

    const user=await User.findById(userId)
    if(!user){
        throw new ApiError(404, "User not found")
    }

    const playlist=await Playlist.aggregate([
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
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videosDocs",
                pipeline: [
                    {
                        $match: {
                            isPublished: true
                        },
                        
                    },
                    {
                        thumbnail: {
                            $first: "$videoDocs.thumbnail"
                        }
                    }
                ]
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                totalVideos: 1,
                thumbnail: 1
            } 
        }
    ])


    return res
    .status(200)
    .json(new ApiResponse(200, playlists, "User playlists fetched successfully"))
});

const getPlaylistById=asyncHandler(async(req, res)=>{

    const {playlistId}=req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlistId")
    }

    const playlist=await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
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
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
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
                            title: 1,
                            description: 1,
                            thumbnail: 1,
                            duration: 1,
                            views: 1,
                            createdAt: 1,
                            owner: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { 
                    $first: "$owner" 
                },
                videosCount: { 
                    $size: "$videos" 
                }
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                owner: 1,
                videos: 1,
                videosCount: 1
            }
        }
    ])

    if(!playlist?.length){
        throw new ApiError(404, "Playlist not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, playlist[0], "Playlist fetched successfully"))
});

const addVideoToPlaylist=asyncHandler(async(req, res)=>{

    const {playlistId, videoId}=req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlistId")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }

    const playlist=await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }

    if(playlist.owner.toString()!==req.user?._id.toString()){
        throw new ApiError(403, "You are not allowed to modify this playlist")
    }

    const video=await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video not found")
    }

    if(!video.isPublished && video.owner.toString()!==req.user?._id.toString()){
        throw new ApiError(403, "This video is not available")
    }

    const alreadyAdded=playlist.videos.some(
        (id) => id.toString()===videoId
    )

    if(alreadyAdded){
        throw new ApiError(409, "Video already exists in this playlist")
    }

    const updatedPlaylist=await Playlist.findByIdAndUpdate(
        playlistId,
        { 
            $addToSet: { 
                videos: videoId 
            } 
        },
        { 
            new: true 
        }
    )

    if(!updatedPlaylist){
        throw new ApiError(500, "Failed to add video to playlist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video added to playlist successfully"))
});

const removeVideoFromPlaylist=asyncHandler(async(req, res)=>{

    const {playlistId, videoId}=req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlistId")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }

    const playlist=await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }

    if(playlist.owner.toString()!==req.user?._id.toString()){
        throw new ApiError(403, "You are not allowed to modify this playlist")
    }

    const inPlaylist=playlist.videos.some(
        (id) => id.toString()===videoId
    )
    if(!inPlaylist){
        throw new ApiError(404, "Video not found in this playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { 
            $pull: { 
                videos: videoId 
            } 
        },
        { 
            new: true 
        }
    )

    if(!updatedPlaylist){
        throw new ApiError(500, "Failed to remove video from playlist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video removed from playlist successfully"))
});

const deletePlaylist=asyncHandler(async(req, res)=>{
    const {playlistId}=req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlistId")
    }

    const playlist=await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }

    if(playlist.owner.toString()!==req.user?._id.toString()){
        throw new ApiError(403, "You are not allowed to delete this playlist")
    }

    await Playlist.findByIdAndDelete(playlistId)

    return res
    .status(200)
    .json(new ApiResponse(200, {playlistId}, "Playlist deleted successfully"))
});

const updatePlaylist=asyncHandler(async(req, res)=>{

    const {playlistId}=req.params
    const {name, description}=req.body

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlistId")
    }

    if(!name?.trim() && !description?.trim()){
        throw new ApiError(400, "Provide a name or description to update")
    }

    const playlist=await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }

    if(playlist.owner.toString()!==req.user?._id.toString()){
        throw new ApiError(403, "You are not allowed to edit this playlist")
    }

    const updates = {}

    if(name?.trim()){ 

        const duplicate=await Playlist.findOne({
            name: name.trim(),
            owner: req.user?._id,
            _id: { 
                $ne: playlistId 
            }
        })

        if(duplicate){
            throw new ApiError(409, "You already have a playlist with this name")
        }
        updates.name=name.trim()
    }

    if(description?.trim()){
        updates.description=description.trim();
    }

    const updatedPlaylist=await Playlist.findByIdAndUpdate(
        playlistId,
        { 
            $set: updates 
        },
        { 
            new: true 
        }
    )

    if(!updatedPlaylist){
        throw new ApiError(500, "Failed to update playlist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Playlist updated successfully"))
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}