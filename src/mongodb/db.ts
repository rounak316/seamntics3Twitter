import mongoose from "mongoose";

const uri: string = "mongodb://mongodb:27017/local";

function timeout(ms : number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


export async function connectToMongo() : Promise<any> {

  try{

  
  let connectionResult = await mongoose.connect(uri , {useNewUrlParser: true })
    console.log("Connectd To mongo" )
    
  }  catch(err){

  await timeout(2000)
  console.log("Check your mongo Dude! Will try again in few seconds! ERR")
  return await connectToMongo()
}


}
  // return mongoose.connect(uri , {useNewUrlParser: true }, (err: any) => {
  //   if (err) {
  //     // console.log(err.message);
  //     console.log("Check your mongo Dude! Will try again in few seconds!", err)
  //     await connectToMongo()
  //     // process.exit(1)
  //   } else {
  //     console.log("Succesfully Connected!");
  //   }
  // });



export interface ITweet extends mongoose.Document {
  title: string;
  author: number;
}


export interface IUser extends mongoose.Document {
    screenName: string;
    status: boolean;
    state: string;
    tracking: string;
    verified: boolean;
  }


  
export const UserSchema = new mongoose.Schema({
  screenName: { type: String, required: true },
  status: { type: Boolean, required: true },
  state: { type: String, required: true },
  tracking: { type: Boolean, required: true },
  tracked: { type: Boolean, required: true },
  verified: { type: Boolean, required: true },

});

const TweetSchema = new mongoose.Schema({
created_at: { type: Date }

},
  {strict:false }
);


export const Tweet = mongoose.model("Tweet", TweetSchema);

export const User = mongoose.model<IUser>("User", UserSchema);
// export default User;