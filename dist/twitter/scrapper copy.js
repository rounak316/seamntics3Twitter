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
const RATE_LIMIT_TIME_INTERVAL = 0;
function verifyUser(screen_name) {
    return __awaiter(this, void 0, void 0, function* () {
        let userHandle = { screen_name: screen_name };
        let user;
        try {
            user = yield twitter.get('users/show', userHandle);
        }
        catch (err) {
            console.log("Error", err[0].message);
            return err[0].message;
        }
        let isVerified = user["verified"];
        db_1.User.findOneAndUpdate({ screenName: screen_name }, { "$set": { status: true, verified: isVerified, state: "verified" } })
            .then(data => {
            if (!data)
                throw Error("No such user found");
            console.log(data);
        }).catch(err => {
            console.log("Error", err);
        });
        console.log(screen_name, "is", isVerified);
    });
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
        if (totalTweets > 0) {
            first_id = tweets[0]["id"];
            max_id = tweets[totalTweets - 1]["id"];
            try {
                yield Promise.all(tweets.map((tweet) => {
                    tweet["ids"] = String(tweet["id"]);
                    // console.debug("userMentioned", tweet.entities.user_mentions);
                    return db_1.Tweet.update({ id: tweet.id }, { "$setOnInsert": tweet }, { "upsert": true })
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
                console.log("More records to be fetched!");
                console.log("Next Max_id", first_id, " => ", max_id);
                setTimeout(() => { startCrawline(screenName, max_id); }, RATE_LIMIT_TIME_INTERVAL);
            }
            else {
                console.log("Fetched till", lastElementCreatedAt);
                console.log("Task finished");
                db_1.User.findOneAndUpdate({ screenName: screenName }, { "$set": { status: true, tracked: true } })
                    .then(data => {
                    if (!data)
                        throw Error("No such user found");
                    console.log(data);
                }).catch(err => {
                    console.log("Error", err);
                });
                return;
            }
        }
        else {
            // Probably there are no more tweets to read!
            // Mark the job as finished!
            console.log("API responded with 0 tweets for", screenName, max_id, "Look like there are no more tweets left between the required timelines!");
            console.log("Task finished");
            db_1.User.findOneAndUpdate({ screenName: screenName }, { "$set": { status: true, tracked: true } })
                .then(data => {
                if (!data)
                    throw Error("No such user found");
                console.log(data);
            }).catch(err => {
                console.log("Error", err);
            });
            return;
        }
        // Get last element from the returned results, to check if InitialDate has been reached out yet or not!
        // If not, keep continuing scrapping the data, else mark the job as finished!
    });
}
function loadSavedCheckpoint(screenName) {
    return __awaiter(this, void 0, void 0, function* () {
        let user = yield db_1.User.findOne({ screenName: screenName, verified: true, tracked: false });
        if (!user)
            throw Error("No such user exists!");
        else {
            console.log("Found user");
            let lastTweetFetched = yield db_1.Tweet.findOne({ "user.screen_name": screenName }).sort({ "id": 1 });
            let maxId;
            if (!lastTweetFetched)
                maxId = -1;
            else
                maxId = lastTweetFetched.get("ids");
            startCrawline(screenName, maxId);
        }
    });
}
loadSavedCheckpoint("nodejs");
//# sourceMappingURL=scrapper copy.js.map