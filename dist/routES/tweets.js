"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../mongodb/db");
const util_1 = require("util");
const router = express_1.default.Router();
// Get   tweets between 
router.post("/get/:username", (req, res) => {
    let screenName = req.params["username"];
    let from = req.body["from"];
    let to = req.body["to"];
    let fromWeek = (((from["week"] * 7) - 7) + 1) % 32;
    let toWeek = (to["week"] * 7) % 32;
    let fromHour = from["hour"] % 25;
    let toHour = to["hour"] % 25;
    let fromMonth = from["month"] % 13;
    let toMonth = to["month"] % 13;
    let matchQuery = {};
    if (util_1.isNumber(fromMonth) && util_1.isNumber(toMonth)) {
        matchQuery["month"] = { "$gte": fromMonth, "$lte": toMonth };
    }
    if (util_1.isNumber(fromWeek) && util_1.isNumber(toWeek)) {
        matchQuery["day"] = { "$gte": fromWeek, "$lte": toWeek };
    }
    if (util_1.isNumber(fromHour) && util_1.isNumber(toHour)) {
        matchQuery["hour"] = { "$gte": fromHour, "$lte": toHour };
    }
    if (!screenName) {
        res.send({ status: false });
    }
    else {
        db_1.Tweet.aggregate([
            {
                "$project": {
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
            },
            {
                "$match": matchQuery
            },
            {
                "$project": {
                    "_id": 0,
                    text: "$text",
                }
            }
        ]).then(data => {
            res.send({ status: true, data: data });
        }).catch(err => {
            res.send({ status: false, error: err.message });
        });
    }
});
// Get number of tweets
router.post("/count/:username", (req, res) => {
    let screenName = req.params["username"];
    let from = req.body["from"];
    let to = req.body["to"];
    let fromWeek = (((from["week"] * 7) - 7) + 1) % 32;
    let toWeek = (to["week"] * 7) % 32;
    let fromHour = from["hour"] % 25;
    let toHour = to["hour"] % 25;
    let fromMonth = from["month"] % 13;
    let toMonth = to["month"] % 13;
    let matchQuery = {};
    if (util_1.isNumber(fromMonth) && util_1.isNumber(toMonth)) {
        matchQuery["month"] = { "$gte": fromMonth, "$lte": toMonth };
    }
    if (util_1.isNumber(fromWeek) && util_1.isNumber(toWeek)) {
        matchQuery["day"] = { "$gte": fromWeek, "$lte": toWeek };
    }
    if (util_1.isNumber(fromHour) && util_1.isNumber(toHour)) {
        matchQuery["hour"] = { "$gte": fromHour, "$lte": toHour };
    }
    if (!screenName) {
        res.send({ status: false });
    }
    else {
        db_1.Tweet.aggregate([
            {
                "$project": {
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
            },
            {
                "$match": matchQuery
            },
            { "$group": { _id: null, noOfTweets: { "$sum": 1 } } },
            { "$project": { _id: 0 } }
        ]).then(data => {
            res.send({ status: true, data: data });
        }).catch(err => {
            res.send({ status: false, error: err.message });
        });
    }
});
// Get list of verified users, menitioned in tracked user account
router.get("/get/:username/mentions", (req, res) => {
    let screenName = req.params["username"];
    if (!screenName) {
        res.send({ status: false });
    }
    else {
        db_1.Tweet.aggregate([
            {
                "$match": {
                    'user.screen_name': new RegExp('\\b' + screenName + '\\b', 'i'),
                    'entities.user_mentions.verified': true
                }
            },
            {
                "$group": {
                    "_id": "$entities.user_mentions.screen_name"
                }
            },
            {
                "$project": {
                    "screen_name": "$_id",
                    "_id": 0
                }
            }
        ]).then(data => {
            res.send({ status: true, data: data });
        }).catch(err => {
            res.send({ status: false, error: err.message });
        });
    }
});
router.get("/get/:username", (req, res) => {
    let screenName = req.params["username"];
    if (!screenName) {
        res.send({ status: false });
    }
    else {
        db_1.Tweet.find({ 'user.screen_name': new RegExp('\\b' + screenName + '\\b', 'i') }, { "user": 0, }).limit(20).then(data => {
            if (data.length > 0) {
                let nextCursor = `/tweets/get/${screenName}/${data[data.length - 1]["_id"]}`;
                res.send({ status: false, nextCursor: nextCursor, data: data });
            }
            else {
                res.send({ status: true, data: data });
            }
        }).catch(err => {
            res.send({ status: false, error: err.message });
        });
    }
});
router.get("/get/:username/:cursor", (req, res) => {
    let screenName = req.params["username"];
    let cursor = req.params["cursor"];
    if (!screenName) {
        res.send({ status: false });
    }
    else {
        db_1.Tweet.find({ 'user.screen_name': new RegExp('\\b' + screenName + '\\b', 'i'), "_id": { "$gt": cursor } }, { "user": 0, }).limit(20).then(data => {
            let nextCursor = `/tweets/get/${screenName}/${cursor}`;
            if (data.length > 0) {
                nextCursor = `/tweets/get/${screenName}/${data[data.length - 1]["_id"]}`;
            }
            let startingCursor = `/tweets/get/${screenName}`;
            res.send({ status: true, data: data, nextCursor: nextCursor, startingCursor: startingCursor });
        }).catch(err => {
            res.send({ status: false, error: err.message });
        });
    }
});
exports.TweetsRouter = router;
//# sourceMappingURL=tweets.js.map