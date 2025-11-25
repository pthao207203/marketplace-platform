import { Request, Response } from "express";
import { MessageModel } from "../../models/message.model";
import { UserModel } from "../../models/user.model";
import { ConversationModel } from "../../models/conversation.model";
import { Types } from "mongoose";
import { sendError, sendSuccess } from "../../utils/response";
import { parsePaging } from "../../utils/pagination";

// GET /api/message/conversations
export async function getConversations(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user || !user.sub) return sendError(res, 401, "Unauthorized");
    const userId = new Types.ObjectId(String(user.sub));

    // find conversations the user participates in
    const convs = await ConversationModel.find({ participants: userId })
      .sort({ updatedAt: -1 })
      .lean();
    if (!convs || !convs.length) return sendSuccess(res, { items: [] });

    const convIds = convs.map((c: any) => c._id);

    // aggregate last message + unread count per conversation
    const agg = await MessageModel.aggregate([
      { $match: { conversationId: { $in: convIds } } },
      { $sort: { sentAt: -1 } },
      {
        $group: {
          _id: "$conversationId",
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$senderId", userId] },
                    { $eq: ["$status", "unread"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $project: { conversationId: "$_id", lastMessage: 1, unreadCount: 1 } },
      { $sort: { "lastMessage.sentAt": -1 } },
    ]).exec();

    const aggMap: Record<string, any> = {};
    agg.forEach((a: any) => (aggMap[String(a.conversationId)] = a));

    // collect other participant ids
    const otherIds = new Set<string>();
    convs.forEach((c: any) => {
      const others = (c.participants || [])
        .map((p: any) => String(p))
        .filter((p: string) => p !== String(userId));
      if (others.length) otherIds.add(others[0]);
    });

    const users = otherIds.size
      ? await UserModel.find({ _id: { $in: Array.from(otherIds) } })
          .select("_id userName userAvatar")
          .lean()
      : [];
    const usersMap: Record<string, any> = {};
    users.forEach((u: any) => (usersMap[String(u._id)] = u));

    const items = convs.map((c: any) => {
      const a = aggMap[String(c._id)];
      const other = (c.participants || [])
        .map((p: any) => String(p))
        .filter((p: string) => p !== String(userId))[0];
      return {
        user: usersMap[other]
          ? {
              id: String(usersMap[other]._id),
              userName: usersMap[other].userName,
              userAvatar: usersMap[other].userAvatar,
            }
          : other
          ? { id: other }
          : undefined,
        conversationId: String(c._id),
        lastContent: a?.lastMessage?.content ?? undefined,
        lastContentType: a?.lastMessage?.contentType ?? undefined,
        lastSentAt: a?.lastMessage?.sentAt
          ? new Date(a.lastMessage.sentAt).toISOString()
          : undefined,
        unreadCount: a?.unreadCount ?? 0,
      };
    });

    return sendSuccess(res, { items });
  } catch (err: any) {
    console.error("getConversations error", err);
    return sendError(res, 500, "Internal error", err?.message);
  }
}

// GET /api/message/with/:userId?page=&pageSize=
export async function getConversationWithUser(req: Request, res: Response) {
  try {
    const me = (req as any).user;
    if (!me || !me.sub) return sendError(res, 401, "Unauthorized");
    const otherId = req.params.userId;
    if (!otherId) return sendError(res, 400, "Missing other user id");
    const userId = String(me.sub);
    const { page, pageSize, skip, limit } = parsePaging(req.query);

    // find conversation between the two users
    const conv = await ConversationModel.findOne({
      participants: {
        $all: [new Types.ObjectId(userId), new Types.ObjectId(otherId)],
      },
    }).lean();
    if (!conv) return sendSuccess(res, { items: [], page, pageSize, total: 0 });

    const convId = (conv as any)._id;
    const filter = { conversationId: convId };
    const [docs, total] = await Promise.all([
      MessageModel.find(filter)
        .sort({ sentAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MessageModel.countDocuments(filter),
    ]);

    // mark unread as read for messages in this conversation where sender is not me
    try {
      await MessageModel.updateMany(
        {
          conversationId: convId,
          senderId: { $ne: new Types.ObjectId(userId) },
          status: "unread",
        },
        { $set: { status: "read", readAt: new Date() } }
      ).exec();
    } catch (e) {
      // non-fatal
    }

    const items = (docs || []).map((m: any) => ({
      id: String(m._id),
      senderId: m.senderId ? String(m.senderId) : undefined,
      contentType: m.contentType,
      content: m.content ?? undefined,
      attachments: Array.isArray(m.attachments) ? m.attachments : [],
      status: m.status,
      sentAt: m.sentAt ? new Date(m.sentAt).toISOString() : undefined,
      readAt: m.readAt ? new Date(m.readAt).toISOString() : undefined,
    }));

    return sendSuccess(res, { items, page, pageSize, total });
  } catch (err: any) {
    console.error("getConversationWithUser error", err);
    return sendError(res, 500, "Internal error", err?.message);
  }
}

// POST /api/message
export async function postMessage(req: Request, res: Response) {
  try {
    const me = (req as any).user;
    if (!me || !me.sub) return sendError(res, 401, "Unauthorized");
    const fromId = String(me.sub);

    const body = req.body || {};
    const receiverId = body.receiverId || body.to;
    const providedConversationId = body.conversationId || body.conversation;
    if (!receiverId && !providedConversationId)
      return sendError(res, 400, "Missing receiverId or conversationId");

    const contentType = body.contentType || body.type || "text";
    const content = body.content;
    const attachments = Array.isArray(body.attachments) ? body.attachments : [];
    if (contentType === "text" && (!content || !String(content).trim())) {
      return sendError(res, 400, "Empty text content");
    }

    // determine or create conversation
    let conversationId: any = undefined;
    if (providedConversationId) {
      try {
        conversationId = new Types.ObjectId(String(providedConversationId));
      } catch (e) {
        // invalid id
        conversationId = undefined;
      }
    }

    const fromIdObj = new Types.ObjectId(fromId);
    let conv: any = null;
    if (!conversationId) {
      // find or create conversation for the pair
      const otherIdObj = new Types.ObjectId(String(receiverId));
      conv = await ConversationModel.findOne({
        participants: { $all: [fromIdObj, otherIdObj] },
      }).exec();
      if (!conv) {
        conv = await ConversationModel.create({
          participants: [fromIdObj, otherIdObj],
        });
      }
      conversationId = conv._id;
    } else {
      // ensure conversation exists
      conv = await ConversationModel.findById(conversationId).exec();
      if (!conv && receiverId) {
        // create conversation if receiver provided
        const otherIdObj = new Types.ObjectId(String(receiverId));
        conv = await ConversationModel.create({
          participants: [fromIdObj, otherIdObj],
        });
        conversationId = conv._id;
      }
    }

    const doc: any = {
      conversationId: conversationId,
      senderId: fromIdObj,
      contentType,
      content: content ?? undefined,
      attachments,
      status: "unread",
      sentAt: new Date(),
    };

    const created = await MessageModel.create(doc as any);
    return sendSuccess(
      res,
      {
        id: String(created._id),
        conversationId: created.conversationId
          ? String(created.conversationId)
          : undefined,
        senderId: String(created.senderId),
        contentType: created.contentType,
        content: created.content ?? undefined,
        attachments: created.attachments ?? [],
        status: created.status,
        sentAt: created.sentAt
          ? new Date(created.sentAt).toISOString()
          : undefined,
      },
      201
    );
  } catch (err: any) {
    console.error("postMessage error", err);
    return sendError(res, 500, "Internal error", err?.message);
  }
}

export default { getConversations, getConversationWithUser, postMessage };
