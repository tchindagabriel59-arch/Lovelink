import { NextResponse } from 'next/server';

export async function GET() {
  const masterKey = process.env.PAYDUNYA_MASTER_KEY || '';
  const publicKey = process.env.PAYDUNYA_PUBLIC_KEY || '';
  const privateKey = process.env.PAYDUNYA_PRIVATE_KEY || '';
  const token = process.env.PAYDUNYA_TOKEN || '';
  const mode = process.env.PAYDUNYA_MODE || '';

  return NextResponse.json({
    mode: mode,
    masterKey: {
      length: masterKey.length,
      first5: masterKey.substring(0, 5),
      last5: masterKey.substring(masterKey.length - 5),
      hasSpaces: masterKey !== masterKey.trim(),
    },
    publicKey: {
      length: publicKey.length,
      first5: publicKey.substring(0, 5),
      last5: publicKey.substring(publicKey.length - 5),
      hasSpaces: publicKey !== publicKey.trim(),
    },
    privateKey: {
      length: privateKey.length,
      first5: privateKey.substring(0, 5),
      last5: privateKey.substring(privateKey.length - 5),
      hasSpaces: privateKey !== privateKey.trim(),
    },
    token: {
      length: token.length,
      first5: token.substring(0, 5),
      last5: token.substring(token.length - 5),
      hasSpaces: token !== token.trim(),
    },
  });
}
