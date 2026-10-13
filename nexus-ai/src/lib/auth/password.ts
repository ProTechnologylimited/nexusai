import bcrypt from "bcryptjs";

const COST = 12;
// Computed once; used to equalize timing when the account does not exist.
const DUMMY_HASH = bcrypt.hashSync("nexus-timing-equalizer", COST);

export const hashPassword = (plain: string) => bcrypt.hash(plain, COST);

export async function verifyPassword(plain: string, hash: string | null | undefined) {
  const ok = await bcrypt.compare(plain, hash ?? DUMMY_HASH);
  return ok && !!hash;
}
