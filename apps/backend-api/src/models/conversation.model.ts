import { Schema, model, models, Types } from "mongoose";

const ConversationSchema = new Schema(
  {
    participants: { type: [Types.ObjectId], ref: "User", required: true },
    title: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true, collection: "conversations" }
);

ConversationSchema.index({ participants: 1 });

export const ConversationModel = models.Conversation || model("Conversation", ConversationSchema);

export type ConversationDoc = (typeof ConversationSchema) & { _id: Types.ObjectId };
