import * as bodyParser from "body-parser"; // used to parse the form data that you pass in the request
import express from "express";
import { User,    UserSchema , Tweet } from '../mongodb/db';
import { isNumber } from "util";
const router = express.Router();


// Get Approchability  
router.get("/approchableUsers" , (req: any, res: any) => {


        
        Tweet.aggregate( 
            [


                 {
                    "$match":
                    {
                        "entities.user_mentions.1": {  "$exists": true }  ,

                    }
                }
                ,
                {
                    "$unwind": "$entities.user_mentions",
                }
,
                 
                {
                   
                    "$project": {
                        screen_name: "$user.screen_name",
                        verified: {  "$toInt":  {"$ifNull" : ["$entities.user_mentions.verified", 0]} } ,
                        mentioned: {  "$toInt": "1" },

                    } 
                },

                {
                        "$group": {
                            "_id": "$screen_name" ,
                            "total": {"$sum": 1 },
                            // "mentioned":  {"$sum":{ "$size" :  "$entities.user_mentions" } },
                            "totalCount":  {"$sum": "$mentioned" },
                            "verifiedCount":  {"$sum": "$verified" },
    
    
                        // userMentioned: { $push:  { item: "$entities.user_mentions" } }
                    }
                }
                ,
                {
                    "$project": {
                        _id: 0,
                        screen_name: "$_id",
                        total: "$total",
                        totalCount: "$totalCount",
                        verifiedCount: "$verifiedCount",
                        approchability: { "$multiply":  [  {"$divide": [  { "$subtract" :["$total"  ,  "$verifiedCount" ] }  , "$total"  ]  }  , 100]}
                    }
                }
                ,
                {
                    "$sort": {
                        "approchability": -1
                    }
                }

   


        ]
              ).then( data=>{

                res.send( {status: true , data: data});
            
            
           
        } ).catch( err=>{
            res.send( {status: false  , error: err.message});
        } )
    
});


// Get Leaderboard  
router.post("/leaderboards" , (req: any, res: any) => {


    let from = req.body["from"]
    let to = req.body["to"]

    let fromWeek = (( ( from["week"] * 7 )- 7 )  + 1 ) % 32
    let toWeek = ( to["week"] * 7 )% 32


    let fromHour = from["hour"] % 25
    let toHour = to["hour"] % 25



    let fromMonth = from["month"] % 13
    let toMonth = to["month"] % 13


    let matchQuery : any = {}

    if( isNumber(fromMonth) && isNumber(toMonth)  ){
        matchQuery[ "month" ] = { "$gte": fromMonth , "$lte": toMonth }
    }

    if( isNumber(fromWeek) && isNumber(toWeek)  ){
        matchQuery[ "day" ] = { "$gte": fromWeek , "$lte": toWeek }
    }

    if( isNumber(fromHour) && isNumber(toHour)  ){
        matchQuery[ "hour" ] = { "$gte": fromHour , "$lte": toHour }
    }





        {
        Tweet.aggregate( 
            [
                {
                    "$project"  :
                    {
                    year: { $year: "$created_at" },
                    month: { $month: "$created_at" },
                    day: { $dayOfMonth: "$created_at" },
                    hour: { $hour: "$created_at" },
                    minutes: { $minute: "$created_at" },
                    seconds: { $second: "$created_at" },
                    milliseconds: { $millisecond: "$created_at" },
                    dayOfYear: { $dayOfYear: "$created_at" },
                    dayOfWeek: { $dayOfWeek: "$created_at" },
                    text: "$text",
                    source: "$source",
                    screenName: "$user.screen_name",
                    retweet_count:  { "$ifNull": [ "$retweet_count" , 0] }


                    }
                }
                ,
                {
                    "$sort": {
                        "retweet_count": -1
                    }
                }

                ,
                {
                    "$group": {"_id": "$screenName" ,
                    "retweets": { $first: "$retweet_count" }
                }
                }
           
                ,
                {
                    "$sort": {
                        "retweets": -1
                    }
                }

        ]
              ).then( data=>{

                res.send( {status: true , data: data});
            
            
           
        } ).catch( err=>{
            res.send( {status: false  , error: err.message});
        } )
    }
});

// Get   tweets between 
router.post("/get/:username" , (req: any, res: any) => {

    let screenName = req.params["username"]


    let from = req.body["from"]
    let to = req.body["to"]

    let fromWeek = (( ( from["week"] * 7 )- 7 )  + 1 ) % 32
    let toWeek = ( to["week"] * 7 )% 32


    let fromHour = from["hour"] % 25
    let toHour = to["hour"] % 25



    let fromMonth = from["month"] % 13
    let toMonth = to["month"] % 13


    let matchQuery : any = {}

    if( isNumber(fromMonth) && isNumber(toMonth)  ){
        matchQuery[ "month" ] = { "$gte": fromMonth , "$lte": toMonth }
    }

    if( isNumber(fromWeek) && isNumber(toWeek)  ){
        matchQuery[ "day" ] = { "$gte": fromWeek , "$lte": toWeek }
    }

    if( isNumber(fromHour) && isNumber(toHour)  ){
        matchQuery[ "hour" ] = { "$gte": fromHour , "$lte": toHour }
    }





    if(!screenName) {
        res.send( {status : false} )
    } else{
        Tweet.aggregate( 
            [
                {
                    "$project"  :
                    {
                    year: { $year: "$created_at" },
                    month: { $month: "$created_at" },
                    day: { $dayOfMonth: "$created_at" },
                    hour: { $hour: "$created_at" },
                    minutes: { $minute: "$created_at" },
                    seconds: { $second: "$created_at" },
                    milliseconds: { $millisecond: "$created_at" },
                    dayOfYear: { $dayOfYear: "$created_at" },
                    dayOfWeek: { $dayOfWeek: "$created_at" },
                    text: "$text",
                    source: "$source",

                    }
                }

                ,
                {
                    "$match": matchQuery
                },
                {
                    "$project": {
                        "_id": 0,
                    text: "$text",
                    }
                }

        ]
              ).then( data=>{

                res.send( {status: true , data: data});
            
            
           
        } ).catch( err=>{
            res.send( {status: false  , error: err.message});
        } )
    }
});

// Get number of tweets
router.post("/count/:username" , (req: any, res: any) => {

    let screenName = req.params["username"]


    let from = req.body["from"]
    let to = req.body["to"]

    let fromWeek = (( ( from["week"] * 7 )- 7 )  + 1 ) % 32
    let toWeek = ( to["week"] * 7 )% 32


    let fromHour = from["hour"] % 25
    let toHour = to["hour"] % 25



    let fromMonth = from["month"] % 13
    let toMonth = to["month"] % 13


    let matchQuery : any = {}

    if( isNumber(fromMonth) && isNumber(toMonth)  ){
        matchQuery[ "month" ] = { "$gte": fromMonth , "$lte": toMonth }
    }

    if( isNumber(fromWeek) && isNumber(toWeek)  ){
        matchQuery[ "day" ] = { "$gte": fromWeek , "$lte": toWeek }
    }

    if( isNumber(fromHour) && isNumber(toHour)  ){
        matchQuery[ "hour" ] = { "$gte": fromHour , "$lte": toHour }
    }





    if(!screenName) {
        res.send( {status : false} )
    } else{
        Tweet.aggregate( 
            [
                {
                    "$project"  :
                    {
                    year: { $year: "$created_at" },
                    month: { $month: "$created_at" },
                    day: { $dayOfMonth: "$created_at" },
                    hour: { $hour: "$created_at" },
                    minutes: { $minute: "$created_at" },
                    seconds: { $second: "$created_at" },
                    milliseconds: { $millisecond: "$created_at" },
                    dayOfYear: { $dayOfYear: "$created_at" },
                    dayOfWeek: { $dayOfWeek: "$created_at" },
                    text: "$text",
                    source: "$source",

                    }
                }

                ,
                {
                    "$match": matchQuery
                }

                ,
         
                    { "$group": { _id: null, noOfTweets: { "$sum": 1 } } },
                     { "$project": { _id: 0 } }
        ]
              ).then( data=>{

                res.send( {status: true , data: data});
            
            
           
        } ).catch( err=>{
            res.send( {status: false  , error: err.message});
        } )
    }
});

// Get list of verified users, menitioned in tracked user account
router.get("/get/:username/mentions" , (req: any, res: any) => {

    let screenName = req.params["username"]


    if(!screenName) {
        res.send( {status : false} )
    } else{
        Tweet.aggregate( 
            [



                {
                    "$match":
                        {
                            'user.screen_name'    : new RegExp('\\b' + screenName + '\\b', 'i') ,
                            'entities.user_mentions.verified': true 
                        
                        }  
                    
                } ,
              
                {
                        "$group":
                                {
                                    "_id": "$entities.user_mentions.screen_name"
                                }
                },
                {
                    "$project": {
                            "screen_name" : "$_id",
                            "_id": 0
                    }

                }
        ]
              ).then( data=>{

                res.send( {status: true , data: data});
            
            
           
        } ).catch( err=>{
            res.send( {status: false , error: err.message});
        } )
    }
});

router.get("/get/:username" , (req: any, res: any) => {

    let screenName = req.params["username"]


    if(!screenName) {
        res.send( {status : false} )
    } else{
        Tweet.find( {'user.screen_name'    : new RegExp('\\b' + screenName + '\\b', 'i') }  , {"user": 0 ,}).limit(20).then( data=>{

            
            if(  data.length > 0){
              let  nextCursor =  `/tweets/get/${screenName}/${data[data.length-1]["_id"]}`
              res.send( {status: false, nextCursor: nextCursor , data: data});
            } else{
                res.send( {status: true , data: data});
            }
            
           
        } ).catch( err=>{
            res.send( {status: false , error: err.message});
        } )
    }
});



router.get("/get/:username/:cursor" , (req: any, res: any) => {

    let screenName = req.params["username"]
    let cursor =  req.params["cursor"]


    if(!screenName) {
        res.send( {status : false} )
    } else{
        Tweet.find( {'user.screen_name'    : new RegExp('\\b' + screenName + '\\b', 'i')  ,  "_id":  {"$gt" :  cursor} }    , {"user": 0 ,}).limit(20).then( data=>{
            let nextCursor = `/tweets/get/${screenName}/${cursor}`
            if(  data.length > 0){
                nextCursor =  `/tweets/get/${screenName}/${data[data.length-1]["_id"]}`
            }
            let startingCursor = `/tweets/get/${screenName}`
            
            res.send( {status: true , data: data , nextCursor: nextCursor, startingCursor: startingCursor});
        } ).catch( err=>{
            res.send( {status: false , error: err.message});
        } )
    }
});



export const TweetsRouter = router