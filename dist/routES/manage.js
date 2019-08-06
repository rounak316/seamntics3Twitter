"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../mongodb/db");
const router = express_1.default.Router();
router.get("/track", (req, res) => {
    db_1.User.find({ "tracking": { "$exists": true } }).then(data => {
        res.send({ status: true, data: data });
    }).catch(err => {
        res.json({ status: false, data: [] });
    });
});
router.post("/track", (req, res) => {
    try {
        let screenName = req.body["username"];
        if (!screenName)
            throw Error("No username provided!");
        db_1.User.findOne({ screenName: screenName }).then((data) => {
            if (!data)
                throw Error("No such user exists");
            res.send({ status: true, data: data });
        }).catch(err => {
            console.log(err);
            db_1.User.create({
                screenName: screenName,
                status: false,
                state: "enqueued",
                tracking: false,
                verified: false,
                tracked: false,
            }).then((data) => {
                res.json({ status: true, data });
            }).catch(err => {
                console.log("Could not create user!", err);
                res.json({ status: false, err: err });
            });
        });
    }
    catch (err) {
        console.log(err);
        res.send({ status: false, message: err });
    }
});
exports.ManageRouter = router;
//# sourceMappingURL=manage.js.map