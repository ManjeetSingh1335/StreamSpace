import mongoose from "mongoose"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const healthcheck=asyncHandler(async(req, res)=>{

    const dbConnected=mongoose.connection.readyState === 1
    const statusCode=dbConnected? 200:503

    const data={
        status: dbConnected? "OK" : "DEGRADED",
        database: dbConnected? "connected" : "disconnected",
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    }

    return res
    .status(statusCode)
    .json(new ApiResponse(statusCode, data, dbConnected? "Server is running" : "Database unavailable"))
})

export {healthcheck}