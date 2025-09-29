export async function sendOtpSms(phone: string, code: string) {
  // TODO: tích hợp nhà cung cấp thật.
  console.log(`[SMS] to ${phone}: OTP = ${code}`);
  return true;
}
