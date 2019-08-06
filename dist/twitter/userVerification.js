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
let InitialDate = new Date("2019-01-01");
let FinalDate = new Date("2019-06-01");
let auth = {
    consumer_key: 'Q9BmmtqRTWqm1OYsNlqOWLUiV',
    consumer_secret: 'Q1WbQJkf9R5b4wEukEzKfE0uCSymuoauyEoEuC6qLbhUJLOMJG',
    access_token_key: '3252585180-dnwZvm576oeQZOylITCoLjzeWahBJdPRKGKIUqm',
    access_token_secret: 'IJhcWDEAehyHxQpLoc0ccTafJe9TVPIHsZflLuxOoCLUI'
};
let twitter = new twitter_1.default(auth);
const RATE_LIMIT_TIME_INTERVAL = 2000;
function startCrawline(max_id = -1) {
    return __awaiter(this, void 0, void 0, function* () {
        let userHandle;
        if (max_id == -1) {
            userHandle = { screen_name: 'nodejs', trim_user: 1 };
        }
        else {
            userHandle = { screen_name: 'nodejs', max_id: max_id, trim_user: 1 };
        }
        let tweets = yield twitter.get('statuses/user_timeline', userHandle);
        let totalTweets = tweets.length;
        let first_id = 0;
        if (totalTweets > 0) {
            first_id = tweets[0]["id"];
            max_id = tweets[totalTweets - 1]["id"];
            tweets.forEach((tweet) => {
                console.debug("userMentioned", tweet.entities.user_mentions);
            });
            let lastElementCreatedAt = new Date(tweets[totalTweets - 1]["created_at"]);
            let timeDiff = lastElementCreatedAt.getTime() - InitialDate.getTime();
            console.log("TimeDiff", lastElementCreatedAt, InitialDate, timeDiff);
            if (timeDiff > 0) {
                console.log("Fetched till", lastElementCreatedAt);
                console.log("More records to be fetched!");
                console.log("Next Max_id", first_id, " => ", max_id);
                setTimeout(() => { startCrawline(max_id); }, RATE_LIMIT_TIME_INTERVAL);
            }
            else {
                console.log("Fetched till", lastElementCreatedAt);
                console.log("Task finished");
                return;
            }
        }
        else {
            // Probably there are no more tweets to read!
            // Mark the job as finished!
        }
        // Get last element from the returned results, to check if InitialDate has been reached out yet or not!
        // If not, keep continuing scrapping the data, else mark the job as finished!
    });
}
startCrawline();
//# sourceMappingURL=userVerification.js.map