"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uri = "mongodb://localhost:27017/local";
mongoose_1.default.connect(uri, { useNewUrlParser: true }, (err) => {
    if (err) {
        // console.log(err.message);
    }
    else {
        console.log("Succesfully Connected!");
    }
});
exports.UserSchema = new mongoose_1.default.Schema({
    screenName: { type: String, required: true },
    status: { type: Boolean, required: true },
    state: { type: String, required: true },
    tracking: { type: Boolean, required: true },
    tracked: { type: Boolean, required: true },
    verified: { type: Boolean, required: true },
});
const TweetSchema = new mongoose_1.default.Schema({
    created_at: { type: Date }
}, { strict: false });
exports.Tweet = mongoose_1.default.model("Tweet", TweetSchema);
exports.User = mongoose_1.default.model("User", exports.UserSchema);
// export default User;
//# sourceMappingURL=db.js.map