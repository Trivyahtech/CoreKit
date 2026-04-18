import { randomBytes } from 'crypto';

/**
 * Generate a random hex token of the specified byte length.
 */
export function generateToken(byteLength: number = 32): string {
  return randomBytes(byteLength).toString('hex');
}

/**
 * Generate a numeric OTP of the specified digit length.
 */
export function generateOtp(length: number = 6): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}
