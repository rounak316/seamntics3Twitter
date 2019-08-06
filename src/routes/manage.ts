import * as bodyParser from "body-parser"; // used to parse the form data that you pass in the request
import express from "express";
import { User,    UserSchema , } from '../mongodb/db';
const router = express.Router();





router.get("/track" , (req: any, res: any) => {

    User.find( {} ).then( data=>{
    res.send({status: true, data: data })
    } ).catch( err=>{
    res.json( {status: false, data: []} ) 
    } )

})

router.post("/track" , (req: any, res: any) => {

        try{
          let screenName = req.body["username"];
          if(!screenName)
            throw Error("No username provided!")

            User.findOne( {screenName: screenName} ).then( (data)=>{
              
              if(!data)
                throw Error("No such user exists")

              res.send({ status: true, data : data})

            }  ).catch(err=>{
              console.log(err)



              User.create( {

                screenName: screenName,
                status: false,
                state: "enqueued",
                tracking: false,
                verified: false,
                tracked: false,


              } ).then( (data)=>{

                res.json( { status: true , data }  )
              }  ).catch( err=>{
                console.log("Could not create user!", err)
                res.json( { status: false , err: err }  )
              } )
              

            })

        
        } catch(err){
          console.log(err)
          res.send({status: false, message: err })
        }

     
});
  


export const ManageRouter = router