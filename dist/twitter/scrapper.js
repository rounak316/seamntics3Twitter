"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const twitter_1 = __importDefault(require("twitter"));
const db_1 = require("./../mongodb/db");
const credentials_1 = require("./credentials");
let InitialDate = new Date("2019-01-01");
let FinalDate = new Date("2019-06-01");
let auth = credentials_1.AUTH;
let twitter = new twitter_1.default(auth);
const RATE_LIMIT_TIME_INTERVAL = 1000;
const RATE_LIMIT_TIME_INTERVAL_STATUS_FEtCH = 2000;
const RATE_LIMIT_TIME_INTERVAL_USER_VERIFICATION = 10000;
function verifyUser(screen_name) {
    return __awaiter(this, void 0, void 0, function* () {
        let userHandle = { screen_name: screen_name };
        let user;
        try {
            user = yield twitter.get('users/show', userHandle);
        }
        catch (err) {
            if (err[0].code == 88) {
                console.log("Error", userHandle, err[0], err[0].message);
                throw Error(screen_name + " coudn' verify!");
            }
            else {
                console.log("Error", userHandle, err[0], err[0].message);
                user = { "verified": false };
            }
        }
        let isVerified = user["verified"];
        try {
            let tweetCollectionUpdateResult = yield db_1.Tweet.updateMany({
                "entities.user_mentions.screen_name": new RegExp('\\b' + screen_name + '\\b', 'i')
            }, {
                "$set": {
                    "entities.user_mentions.$[mention].verified": isVerified
                }
            }, { arrayFilters: [
                    {
                        "mention.screen_name": new RegExp('\\b' + screen_name + '\\b', 'i')
                    }
                ]
            });
            console.log("tweetCollectionUpdateResult", tweetCollectionUpdateResult);
        }
        catch (err) {
            console.log("tweetCollectionUpdateResult: err", err);
        }
        db_1.User.findOneAndUpdate({ screenName: new RegExp('\\b' + screen_name + '\\b', 'i') }, { "$set": { status: true, verified: true, state: "verified" } })
            .then(data => {
            // if(!data)
            // throw Error("No such user found")
            console.log(data);
        }).catch(err => {
            console.log("Error", err);
        });
        console.log(screen_name, "is", isVerified);
    });
}
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function startCrawline(screenName, max_id = -1) {
    return __awaiter(this, void 0, void 0, function* () {
        let userHandle;
        if (max_id == -1) {
            userHandle = { screen_name: screenName, trim_user: 0 };
        }
        else {
            userHandle = { screen_name: screenName, max_id: max_id, trim_user: 0 };
        }
        let tweets = yield twitter.get('statuses/user_timeline', userHandle);
        let totalTweets = tweets.length;
        let first_id = 0;
        console.log("Foud", totalTweets, max_id);
        if (totalTweets > 1) {
            first_id = tweets[0]["id"];
            max_id = tweets[totalTweets - 1]["id"];
            try {
                yield Promise.all(tweets.map((tweet) => {
                    tweet["ids"] = String(tweet["id"]);
                    // console.debug("userMentioned", tweet.entities.user_mentions);
                    return db_1.Tweet.update({ ids: tweet.ids }, { "$setOnInsert": tweet }, { "upsert": true })
                        .then((saveTweetToMongo) => {
                        // console.log("saveTweetToMongo", saveTweetToMongo)
                    }).catch((err) => {
                        console.log("Error", err);
                    });
                }));
            }
            catch (err) {
                console.log("Error", err);
            }
            console.log("All Saved in Mongo");
            let lastElementCreatedAt = new Date(tweets[totalTweets - 1]["created_at"]);
            let timeDiff = lastElementCreatedAt.getTime() - InitialDate.getTime();
            console.log("TimeDiff", lastElementCreatedAt, InitialDate, timeDiff);
            if (timeDiff > 0) {
                console.log("Fetched till", lastElementCreatedAt);
                console.log("More records to be fetched for ", screenName);
                console.log("Next Max_id", first_id, " => ", max_id);
                yield timeout(RATE_LIMIT_TIME_INTERVAL);
                return yield startCrawline(screenName, max_id);
            }
            else {
                console.log("Fetched till", lastElementCreatedAt);
                console.log("Task finished");
                let result = yield db_1.User.findOneAndUpdate({ screenName: screenName }, { "$set": { status: true, tracked: true } });
                if (!result) {
                    throw Error("No such user found" + result);
                }
                return;
            }
        }
        else {
            // Probably there are no more tweets to read!
            // Mark the job as finished!
            console.log("API responded with 0 tweets for", screenName, max_id, "Look like there are no more tweets left between the required timelines!");
            console.log("Task finished");
            let result = yield db_1.User.findOneAndUpdate({ screenName: screenName }, { "$set": { status: true, tracked: true } });
            if (!result)
                throw Error("No such user found");
            return result;
        }
        // Get last element from the returned results, to check if InitialDate has been reached out yet or not!
        // If not, keep continuing scrapping the data, else mark the job as finished!
    });
}
exports.startCrawline = startCrawline;
function StartPollingForFindingUserMentions() {
    return __awaiter(this, void 0, void 0, function* () {
        let screenName = null;
        try {
            let userMentions = yield db_1.Tweet.aggregate([
                { "$match": { "entities.user_mentions.verified": { "$exists": false } } },
                { "$unwind": "$entities.user_mentions" },
                { "$group": { "_id": "$entities.user_mentions.screen_name" } },
                { "$project": { "screen_name": "$_id", "_id": 0 } },
                { "$limit": 1 }
            ]);
            console.log("userMentions", userMentions);
            if (userMentions.length > 0)
                screenName = userMentions[0]['screen_name'];
        }
        catch (err) {
        }
        return screenName;
    });
}
exports.StartPollingForFindingUserMentions = StartPollingForFindingUserMentions;
function findAndVerifyNewUser() {
    return __awaiter(this, void 0, void 0, function* () {
        let user = null;
        try {
            user = yield db_1.User.findOne({ state: "enqueued" });
            if (!user) {
                console.log("No New user found to be verified!");
                let screenNameFromTweet = yield StartPollingForFindingUserMentions();
                if (screenNameFromTweet) {
                    console.log("User found from mentions, which needs to be verified!");
                }
                else {
                    console.log("No New user_mentions found to be verified!");
                }
                yield verifyUser(screenNameFromTweet);
                yield timeout(2000);
                yield findAndVerifyNewUser();
                // setTimeout( findAndVerifyNewUser , 2000 )
            }
            else {
                yield verifyUser(user.screenName);
                // await User.findByIdAndUpdate( user.id , { "$set": {state : "conpleted"}  } );
                yield timeout(2000);
                yield findAndVerifyNewUser();
                setTimeout(findAndVerifyNewUser, 2000);
            }
        }
        catch (err) {
            console.log("Something went wrong!", err);
            if (user) {
                yield db_1.User.findByIdAndUpdate(user.id, { "$set": { state: "failed", verified: false, tracked: false } });
            }
            yield timeout(RATE_LIMIT_TIME_INTERVAL_USER_VERIFICATION);
            yield findAndVerifyNewUser();
            // setTimeout( findAndVerifyNewUser , RATE_LIMIT_TIME_INTERVAL_USER_VERIFICATION )
        }
    });
}
exports.findAndVerifyNewUser = findAndVerifyNewUser;
function loadSavedCheckpoint(screenName) {
    return __awaiter(this, void 0, void 0, function* () {
        let user = yield db_1.User.findOne({ screenName: screenName, verified: true, tracked: false });
        if (!user)
            throw Error("No such user exists!" + screenName);
        else {
            console.log("Found user");
            let lastTweetFetched = yield db_1.Tweet.findOne({ "user.screen_name": new RegExp('\\b' + screenName + '\\b', 'i') }).sort({ "ids": 1 });
            let maxId;
            if (!lastTweetFetched)
                maxId = -1;
            else
                maxId = lastTweetFetched.get("ids");
            console.log("Starting crawling process", screenName, maxId);
            return yield startCrawline(screenName, maxId);
        }
    });
}
exports.loadSavedCheckpoint = loadSavedCheckpoint;
//  loadSavedCheckpoint("nodejs")
//# sourceMappingURL=scrapper.js.map