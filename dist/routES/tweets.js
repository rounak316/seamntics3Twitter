"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../mongodb/db");
const router = express_1.default.Router();
router.get("/get/:username", (req, res) => {
    let screenName = req.params["username"];
    console.log("Katyperry", screenName);
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
    console.log("Katyperry", screenName, cursor);
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