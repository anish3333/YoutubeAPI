import 'dotenv/config'
import express from "express"
import connectDB from "./db/index.js";




connectDB();

// const app = express();
// const port = process.env.PORT || 3000;
// ;( async ()=>{
//     try {
//        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//        app.on('error', (error)=>{
//         console.log("ERROR :: EXPRESS_APP_DB :: ", error);
//         throw error;
//        })
       
//        app.listen(port, ()=>{
//             console.log(`App is listening on port ${port}`)
//        })
//     } catch (error) {
//         console.log("ERROR :: DB_CONNECTION :: ", error);
//     }
// } )()