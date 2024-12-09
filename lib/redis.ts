import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export const setVerificationCode = async (phone: string, code: string) => {
  // Код действителен 10 минут
  await redis.set(`verification:${phone}`, code, "EX", 600);
};

export const getVerificationCode = async (phone: string) => {
  return await redis.get(`verification:${phone}`);
};

export const deleteVerificationCode = async (phone: string) => {
  await redis.del(`verification:${phone}`);
};

export const setTelegramBinding = async (telegramId: string, phone: string) => {
  // Привязка действительна 30 минут
  await redis.set(`telegram:${telegramId}`, phone, "EX", 1800);
};

export const getTelegramBinding = async (telegramId: string) => {
  return await redis.get(`telegram:${telegramId}`);
};

export default redis;
