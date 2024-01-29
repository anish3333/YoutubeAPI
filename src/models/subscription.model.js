import mongoose,{Schema} from 'mongoose';


// this schema represents a channel being subscribed by a subscriber
const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, //the user who is subscribing
      ref: "User"
    },
    channel: {
      type: Schema.Types.ObjectId, //the one being subscribed
      ref: "User"
    }
  },
  {timestamps: true}
)

export const Subscription = mongoose.model("Subscription", subscriptionSchema)