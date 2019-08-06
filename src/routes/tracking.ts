import * as bodyParser from "body-parser"; // used to parse the form data that you pass in the request
import express from "express";
import { User,    UserSchema , } from '../mongodb/db';
const router = express.Router();


router.get("/" , (req: any, res: any) => res.send("hi"));


export const TrackingRouter = router