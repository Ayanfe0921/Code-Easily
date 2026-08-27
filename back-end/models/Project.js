import mongoose,  {Schema} from 'mongoose'

const ProjectSchema = new Schema({
    name: {type: String, required: true, default: "Untitled Project" },
    
},{timestamps: true})



export const User = mongoose.model('User', UserSchema)