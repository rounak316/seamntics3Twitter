import Twitter from 'twitter';
import {AccessTokenOptions} from 'twitter';
import {User , Tweet} from  './../mongodb/db';
import { AUTH } from './credentials'

let InitialDate = new Date( "2019-01-01")
let FinalDate = new Date( "2019-06-01" )


let auth = AUTH

let twitter = new Twitter( auth  );

const RATE_LIMIT_TIME_INTERVAL = 1000
const RATE_LIMIT_TIME_INTERVAL_STATUS_FEtCH = 2000

const RATE_LIMIT_TIME_INTERVAL_USER_VERIFICATION = 10000



async function verifyUser( screen_name : String ){

    let userHandle = {screen_name: screen_name};
    let user : any;
    try{
        user = await twitter.get('users/show', userHandle );
    } catch(err){
        console.log("Error",userHandle, err[0].message );
        throw Error( screen_name + " coudn' verify!" )
    }
    let isVerified = user["verified"]



    try {
        
            let tweetCollectionUpdateResult =  await Tweet.updateMany(  { 
                "entities.user_mentions.screen_name":  new RegExp('\\b' + screen_name + '\\b', 'i') 
                },

                {
                    "$set": {
                        "entities.user_mentions.$[mention].verified" : isVerified
                        }
                }
      ,
      
      
      {arrayFilters: [
          { 
        "mention.screen_name":  new RegExp('\\b' + screen_name + '\\b', 'i') 
        }
    ]
    }  

                 )

            console.log( "tweetCollectionUpdateResult" , tweetCollectionUpdateResult )

            } 
    catch(err)  {
             console.log( "tweetCollectionUpdateResult: err" , err )
    }
   

    User.findOneAndUpdate( {screenName: new RegExp('\\b' + screen_name + '\\b', 'i')  } , { "$set": { status : true, verified: true , state: "verified" } } )
    .then( data => {
        // if(!data)
            // throw Error("No such user found")

        console.log(data);
    } ).catch(err=>{
        console.log("Error" , err)
    })
    console.log( screen_name , "is" , isVerified)


}


function timeout(ms : any) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function startCrawline( screenName : String ,  max_id = -1 ) : Promise<any> {    

    let userHandle;
    if(max_id == -1){
        userHandle = {screen_name: screenName, trim_user: 0 };
    } else{
        userHandle = {screen_name: screenName,  max_id: max_id, trim_user: 0 };
    }

   

    let tweets : any= await twitter.get('statuses/user_timeline', userHandle );
    let totalTweets =  tweets.length
    let first_id = 0;
    console.log("Foud", totalTweets, max_id)
    if( totalTweets > 1 ){
        
        first_id = tweets[ 0 ]["id"]
        max_id = tweets[ totalTweets - 1 ]["id"];

        try{

        await Promise.all( tweets.map( (tweet : any) => {

            tweet["ids"] = String( tweet["id"] )
            // console.debug("userMentioned", tweet.entities.user_mentions);
           return  Tweet.update({ ids : tweet.ids} , { "$setOnInsert" : tweet } , { "upsert": true })
            .then( (saveTweetToMongo)=>{
                // console.log("saveTweetToMongo", saveTweetToMongo)
            } ).catch( (err)=>{
                console.log("Error" , err)
                  } )
            
           
           } ) )

        } catch(err){
            console.log("Error", err)
        }

        console.log("All Saved in Mongo")

        let lastElementCreatedAt = new Date( tweets[ totalTweets - 1 ]["created_at"] );

        let timeDiff = lastElementCreatedAt.getTime() - InitialDate.getTime() 
        console.log("TimeDiff", lastElementCreatedAt, InitialDate, timeDiff  )
        if(timeDiff > 0){
            console.log("Fetched till", lastElementCreatedAt)
            console.log("More records to be fetched for " , screenName)
            console.log("Next Max_id", first_id , " => " , max_id)

            await timeout(  RATE_LIMIT_TIME_INTERVAL )

            return await startCrawline(screenName,  max_id)

        } else{

            console.log("Fetched till", lastElementCreatedAt)
            console.log("Task finished");
            let result = await User.findOneAndUpdate( {screenName: screenName} , { "$set": { status : true , tracked: true } } )
            
            if(!result){
                throw Error("No such user found" +  result)
            }

            return 
        }

    } else  {
        // Probably there are no more tweets to read!
        // Mark the job as finished!

        console.log("API responded with 0 tweets for" , screenName, max_id, "Look like there are no more tweets left between the required timelines!")
        console.log("Task finished");
        let result = await  User.findOneAndUpdate( {screenName: screenName} , { "$set": { status : true , tracked: true } } )
        if(!result)
            throw Error("No such user found")
        

        return result
    }

    // Get last element from the returned results, to check if InitialDate has been reached out yet or not!
    // If not, keep continuing scrapping the data, else mark the job as finished!

    

 }



export async function StartPollingForFindingUserMentions() : Promise<any> {

        let screenName = null;
        try{
            let userMentions = await Tweet.aggregate( [
                {"$match": { "entities.user_mentions.verified": { "$exists" : false } } },
              
                {"$unwind": "$entities.user_mentions"}, 
                 {"$group": {"_id": "$entities.user_mentions.screen_name" } },
                {"$project": {"screen_name": "$_id" , "_id": 0 } },
                {"$limit": 1}
    
            ] )
            console.log("userMentions" ,userMentions)
            if(userMentions.length > 0)
                screenName = userMentions[0]['screen_name']
            
        } catch(err){
    
        }
    
        return screenName
    }


 export async function findAndVerifyNewUser(){
    
    let user = null;
    
    try{
        user = await User.findOne( {state: "enqueued" } );
        if(!user){
            console.log("No New user found to be verified!")

            let screenNameFromTweet = await StartPollingForFindingUserMentions()
            if(screenNameFromTweet){
                console.log("User found from mentions, which needs to be verified!")
                
            } else{
                console.log("No New user_mentions found to be verified!")
            }

            await verifyUser( screenNameFromTweet )
            await timeout(2000)
            await findAndVerifyNewUser()
            // setTimeout( findAndVerifyNewUser , 2000 )
        } else{
            await verifyUser( user.screenName )
            // await User.findByIdAndUpdate( user.id , { "$set": {state : "conpleted"}  } );
            await timeout(2000)
            await findAndVerifyNewUser()
            setTimeout( findAndVerifyNewUser , 2000 )
        }
    } catch(err){
        console.log("Something went wrong!", err)
        if(user){
            await User.findByIdAndUpdate( user.id , { "$set": {state : "failed", verified: false , tracked: false}  } );
        }
        await timeout(RATE_LIMIT_TIME_INTERVAL_USER_VERIFICATION)
        await findAndVerifyNewUser()
        // setTimeout( findAndVerifyNewUser , RATE_LIMIT_TIME_INTERVAL_USER_VERIFICATION )
    }
        
 }

 export async function loadSavedCheckpoint(screenName : String){

    let user = await User.findOne( {screenName: screenName , verified: true, tracked: false} )
    if(!user )
        throw Error("No such user exists!" +  screenName)
    else{
        console.log("Found user" )
       
        let lastTweetFetched = await Tweet.findOne( { "user.screen_name" :  new RegExp('\\b' + screenName + '\\b', 'i')  } ).sort( {"ids" : 1 } )
        let maxId;
        if(!lastTweetFetched)
            maxId = -1
        else
            maxId = lastTweetFetched.get("ids")
        
        console.log("Starting crawling process", screenName, maxId)
        return await startCrawline(screenName, maxId)
    }


 }


//  loadSavedCheckpoint("nodejs")


