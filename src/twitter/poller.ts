

import {Tweet  , User} from './../mongodb/db';
import {loadSavedCheckpoint,startCrawline ,findAndVerifyNewUser} from './scrapper'



export async function StartPollingForFindingUserMentions() : Promise<any> {

    
    let screenName = null;
    try{
        let userMentions = await Tweet.aggregate( [
            {"$match": { "entities.user_mentions.verified": { "$exists" : false } } },
            {"$unwind": "$entities.user_mentions"}, 
         
            {"$group": {"_id": "$entities.user_mentions.screen_name" } },
            {"$project": {"screen_name": "$_id" , "_id": 0 } },
            {"$limit": 10}

        ] )
        console.log("userMentions" ,userMentions)
        if(userMentions.length > 0)
            screenName = userMentions[0]['screen_name']
        
    } catch(err){

    }

    return screenName
}

// Find an untracked user, and start  / resumme scrapping tweets!
// This has to be wrapped around rate limiting logic
async function startPollingForTrackingNewUser(){

    // console.log("startPolling")
    let screenName = null;
    try{
        let user = await User.findOneAndUpdate( { "verified": true , state: "verified" , tracked: false } , { "$set": { "tracking": true } })
        

        if (!user){
            
            console.log("No user left to be tracked")

        } else{
            screenName = user.screenName;
            await loadSavedCheckpoint( user.screenName );


        }
        console.log("Scheduling next user that has to be tracked")
        setTimeout( startPollingForTrackingNewUser , 2000 );
} catch(err){
    try{
        console.log("Looking for new user, to be tracked", err)
        // Try to update DB about something going wrong, and removing user from to be tracked bucket
        if(screenName != null)
        await User.findOneAndUpdate( { screenName: screenName } ,{ "$set": { "tracking": true , "tracked": true , state: "failed" } })
        
    } catch(err){
        console.log("DB Error! Check Mongo")
       
    }

    let RATE_LIMIT_INTERVAL = 10000;
    setTimeout( startPollingForTrackingNewUser , RATE_LIMIT_INTERVAL )


    // Retry for new data
}
}


async function startPollingForUserVerification(){

    findAndVerifyNewUser()
}

export function Initialise(){
    startPollingForTrackingNewUser()
    startPollingForUserVerification()
}


