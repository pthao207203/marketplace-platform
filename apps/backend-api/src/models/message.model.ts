// apps/backend-api/src/models/message.model.ts
import mongoose from "mongoose";

const { Schema } = mongoose;

// ================= CONSTANTS (bạn cần dùng ở controller) =================
export const MESSAGE_TYPE = {
  TEXT: "text",
  IMAGE: "image",
  VIDEO: "video",
} as const;

export const MESSAGE_STATUS = {
  UNREAD: "unread",
  READ: "read",
} as const;

// ================= SUB-SCHEMAS =================
const AttachmentSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["image", "file", "video"],
      required: true,
    },
    url: { type: String, required: true },
    meta: { type: Schema.Types.Mixed }, // có thể lưu width/height, size, v.v.
  },
  { _id: false }
);

// ================= SCHEMA =================
const MessageSchema = new Schema(
  {
    // Phòng chat giữa 2 user (hoặc nhiều user sau này)
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    // Ai gửi tin nhắn này
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    contentType: {
      type: String,
      enum: Object.values(MESSAGE_TYPE),
      required: true,
      default: MESSAGE_TYPE.TEXT,
    },

    // TEXT: content là bắt buộc
    // IMAGE/VIDEO: có thể chỉ dùng attachments
    content: {
      type: String,
      required: function () {
        // @ts-ignore
        return this.contentType === MESSAGE_TYPE.TEXT;
      },
      trim: true,
    },

    attachments: {
      type: [AttachmentSchema],
      default: [],
    },

    status: {
      type: String,
      enum: Object.values(MESSAGE_STATUS),
      default: MESSAGE_STATUS.UNREAD,
      index: true,
    },

    sentAt: { type: Date, default: Date.now, index: true },
    readAt: { type: Date },
  },
  {
    collection: "messages", // ép tên collection
    timestamps: true,
  }
);

// ================= INDEXES =================

// Load hội thoại theo thời gian
MessageSchema.index({ conversationId: 1, sentAt: 1 });

// Tìm tất cả tin của 1 user (nếu cần thống kê)
MessageSchema.index({ senderId: 1, sentAt: -1 });

// ÉP TẠO COLLECTION NGAY KHI FILE ĐƯỢC IMPORT
MessageSchema.on("index", () => {
  console.log("Collection `messages` đã được tạo trong MongoDB!");
});

// Xóa cache cũ (quan trọng khi hot-reload)
if (mongoose.models.Message) {
  delete (mongoose as any).models.Message;
}

// Tạo model mới hoàn toàn
export const MessageModel = mongoose.model("Message", MessageSchema);

// Type cho document (nếu bạn cần)
export type MessageDoc = mongoose.InferSchemaType<typeof MessageSchema> & {
  _id: mongoose.Types.ObjectId;
};
