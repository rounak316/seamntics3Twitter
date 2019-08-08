import app from "./app";
const PORT = process.env.PORT || 3000;
import {connectToMongo} from './mongodb/db'

async function init(){

  await connectToMongo()

  app.listen(PORT, () => {
    // tslint:disable-next-line:no-console
    console.log("listening on port " + PORT);
  });
}

init()