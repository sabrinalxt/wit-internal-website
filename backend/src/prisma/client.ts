import { PrismaClient } from "@prisma/client";

// use same client everywhere and only once
const prisma = new PrismaClient();
export default prisma;