import { NextResponse } from 'next/server';

export async function GET() {
  // Return redirect URL to WhatsApp contact
  // This will redirect to /we/phone-number
  return NextResponse.json({
    redirect: 'https://wa.me/923339936428',
  });
}
