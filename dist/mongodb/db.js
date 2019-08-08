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
const mongoose_1 = __importDefault(require("mongoose"));
const uri = "mongodb://mongodb:27017/local";
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function connectToMongo() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let connectionResult = yield mongoose_1.default.connect(uri, { useNewUrlParser: true });
            console.log("Connectd To mongo");
        }
        catch (err) {
            yield timeout(2000);
            console.log("Check your mongo Dude! Will try again in few seconds! ERR");
            return yield connectToMongo();
        }
    });
}
exports.connectToMongo = connectToMongo;
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