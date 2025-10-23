import { Schema, model, models, type Types } from 'mongoose';

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
    code: { type: String, required: true },
    name: { type: String, required: true },
    logoUrl: { type: String },
  },
  { _id: false }
);

const SystemSettingsSchema = new Schema(
  {
    siteName: { type: String, default: 'Secondchance' },
    logoUrl: { type: String },
    iconUrl: { type: String },
    partnerBanks: { type: [PartnerBankSchema], default: [] },
    termsAndPolicies: { type: String }, // HTML/Markdown
    auctionPrinciples: { type: String },
    representativeAccount: { type: RepresentativeAccountSchema, default: {} },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: 'system_settings' }
);

export const SystemSettings = models.SystemSettings || model('SystemSettings', SystemSettingsSchema);

// get the singleton (first document). If not exists, create one with defaults.
export async function getSystemSettings() {
  let doc = await SystemSettings.findOne({}).lean();
  if (!doc) {
    const created = await SystemSettings.create({});
    doc = created.toObject();
  }
  return doc;
}

export async function updateSystemSettings(data: Partial<any>) {
  const updated = await SystemSettings.findOneAndUpdate({}, { $set: { ...data, updatedAt: new Date() } }, { upsert: true, new: true }).lean();
  return updated;
}

export type SystemSettingsDoc = InstanceType<typeof SystemSettings> & { _id: Types.ObjectId };
