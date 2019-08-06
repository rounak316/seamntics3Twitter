"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./../mongodb/db");
const scrapper_1 = require("./scrapper");
function StartPollingForFindingUserMentions() {
    return __awaiter(this, void 0, void 0, function* () {
        let screenName = null;
        try {
            let userMentions = yield db_1.Tweet.aggregate([
                { "$match": { "entities.user_mentions.verified": { "$exists": false } } },
                { "$unwind": "$entities.user_mentions" },
                { "$group": { "_id": "$entities.user_mentions.screen_name" } },
                { "$project": { "screen_name": "$_id", "_id": 0 } },
                { "$limit": 10 }
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
// Find an untracked user, and start  / resumme scrapping tweets!
// This has to be wrapped around rate limiting logic
function startPollingForTrackingNewUser() {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log("startPolling")
        let screenName = null;
        try {
            let user = yield db_1.User.findOneAndUpdate({ "verified": true, state: "verified", tracked: false }, { "$set": { "tracking": true } });
            if (!user) {
                console.log("No user left to be tracked");
            }
            else {
                screenName = user.screenName;
                yield scrapper_1.loadSavedCheckpoint(user.screenName);
            }
            console.log("Scheduling next user that has to be tracked");
            setTimeout(startPollingForTrackingNewUser, 2000);
        }
        catch (err) {
            try {
                console.log("Looking for new user, to be tracked", err);
                // Try to update DB about something going wrong, and removing user from to be tracked bucket
                if (screenName != null)
                    yield db_1.User.findOneAndUpdate({ screenName: screenName }, { "$set": { "tracking": true, "tracked": true, state: "failed" } });
            }
            catch (err) {
                console.log("DB Error! Check Mongo");
            }
            let RATE_LIMIT_INTERVAL = 10000;
            setTimeout(startPollingForTrackingNewUser, RATE_LIMIT_INTERVAL);
            // Retry for new data
        }
    });
}
function startPollingForUserVerification() {
    return __awaiter(this, void 0, void 0, function* () {
        scrapper_1.findAndVerifyNewUser();
    });
}
function Initialise() {
    startPollingForTrackingNewUser();
    startPollingForUserVerification();
}
exports.Initialise = Initialise;
//# sourceMappingURL=poller.js.map