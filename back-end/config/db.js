import mongoose from "mongoose";

export async function connectToDatabase(){
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error("MONGODB_URI is not set. Add it to back-end/.env or configure it in Docker Compose.");
    }

    mongoose.connection.on(`connected`, ()=>{
        console.log("successfully connected to MongoDB.")
    })
    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    } catch (error) {
        throw new Error(`Could not connect to MongoDB: ${error.message}. Check that MongoDB is running, the URI is correct, and (for Atlas) this machine's IP is allowed.`, { cause: error });
    }
}
