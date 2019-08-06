import * as bodyParser from "body-parser"; // used to parse the form data that you pass in the request
import express from "express";
import { User,    UserSchema , } from './mongodb/db';
import { TrackingRouter} from './routes/tracking'
import { ManageRouter } from './routes/manage'
import { TweetsRouter } from './routes/tweets'

import { Initialise  as InitialisePoller } from './twitter/poller';

class App {
  public app: express.Application;
  // public tracking: Tracking = new Tracking();
  // public search: Search = new Search();
  // public tweets: Tweets = new Tweets();


  constructor() {
    InitialisePoller();
    this.app = express(); // run the express instance and store in app
    this.config();
    // this.tracking("tracking");
    // this.search("search");
    // this.tweets("tweets");


    this.app.use( "/tracking",  TrackingRouter );
    this.app.use( "/manage",  ManageRouter );
    this.app.use("/tweets", TweetsRouter);


    this.setupDb();
  }
  


  tweets( slug : String) {
    this.app.get("/" + slug, (req: any, res: any) => res.send("hi"));
  }

  search( slug : String) {
    this.app.get("/" + slug, (req: any, res: any) => res.send("hi"));
  }



  private setupDb(): void {
  }

  private config(): void {
    // support application/json type post data
    this.app.use(bodyParser.json());
    // support application/x-www-form-urlencoded post data
    this.app.use(
      bodyParser.urlencoded({
        extended: false
      })
    );
  }
}

export default new App().app;
