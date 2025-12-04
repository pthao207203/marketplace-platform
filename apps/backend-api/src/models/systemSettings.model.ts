import { Schema, model, models, type Types } from "mongoose";

const ContactSchema = new Schema(
  {
    phone: String,
    email: String,
    facebook: String,
    address: String,
  },
  { _id: false }
);

const RepresentativeAccountSchema = new Schema(
  {
    bankName: String,
    accountNumber: String,
    accountHolder: String,
  },
  { _id: false }
);

const PartnerBankSchema = new Schema(
  {
    code: { type: String, default: "" },
    name: { type: String, required: true },
    logoUrl: { type: String },
  },
  { _id: false }
);

const SystemSettingsSchema = new Schema(
  {
    siteName: { type: String, default: "Secondchance" },
    logoUrl: { type: String },
    iconUrl: { type: String },

    contact: { type: ContactSchema, default: {} },

    partnerBanks: { type: [PartnerBankSchema], default: [] },
    termsAndPolicies: { type: String },
    auctionPrinciples: { type: String },
    representativeAccount: { type: RepresentativeAccountSchema, default: {} },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "system_settings" }
);

export const SystemSettings =
  models.SystemSettings || model("SystemSettings", SystemSettingsSchema);

export async function getSystemSettings() {
  let doc = await SystemSettings.findOne({}).lean();
  if (!doc) {
    const created = await SystemSettings.create({});
    doc = created.toObject();
  }
  return doc;
}

export async function updateSystemSettings(data: Partial<any>) {
  const updated = await SystemSettings.findOneAndUpdate(
    {},
    { $set: { ...data, updatedAt: new Date() } },
    { upsert: true, new: true }
  ).lean();
  return updated;
}

export type SystemSettingsDoc = InstanceType<typeof SystemSettings> & {
  _id: Types.ObjectId;
};
