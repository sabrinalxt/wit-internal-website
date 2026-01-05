// Helper to convert BigInt values in the db to string ==> JSON.stringify cannot handle BigInt used by Prisma
export function serializeBigInt(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (_, v) => (typeof v === "bigint" ? v.toString() : v))
  );
}