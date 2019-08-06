"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bodyParser = __importStar(require("body-parser")); // used to parse the form data that you pass in the request
const express_1 = __importDefault(require("express"));
const tracking_1 = require("./routes/tracking");
const manage_1 = require("./routes/manage");
const tweets_1 = require("./routes/tweets");
const poller_1 = require("./twitter/poller");
class App {
    // public tracking: Tracking = new Tracking();
    // public search: Search = new Search();
    // public tweets: Tweets = new Tweets();
    constructor() {
        poller_1.Initialise();
        this.app = express_1.default(); // run the express instance and store in app
        this.config();
        // this.tracking("tracking");
        // this.search("search");
        // this.tweets("tweets");
        this.app.use("/tracking", tracking_1.TrackingRouter);
        this.app.use("/manage", manage_1.ManageRouter);
        this.app.use("/tweets", tweets_1.TweetsRouter);
        this.setupDb();
    }
    tweets(slug) {
        this.app.get("/" + slug, (req, res) => res.send("hi"));
    }
    search(slug) {
        this.app.get("/" + slug, (req, res) => res.send("hi"));
    }
    setupDb() {
    }
    config() {
        // support application/json type post data
        this.app.use(bodyParser.json());
        // support application/x-www-form-urlencoded post data
        this.app.use(bodyParser.urlencoded({
            extended: false
        }));
    }
}
exports.default = new App().app;
//# sourceMappingURL=app.js.map