import bcrypt from 'bcryptjs';
export async function validPassword(password: string, hashedPassword: string) {
  return await bcrypt.compare(password, hashedPassword);
}

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}
