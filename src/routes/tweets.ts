import * as bodyParser from "body-parser"; // used to parse the form data that you pass in the request
import express from "express";
import { User,    UserSchema , Tweet } from '../mongodb/db';
const router = express.Router();


router.get("/get/:username" , (req: any, res: any) => {

    let screenName = req.params["username"]
    console.log("Katyperry", screenName)

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
    console.log("Katyperry", screenName,cursor)

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