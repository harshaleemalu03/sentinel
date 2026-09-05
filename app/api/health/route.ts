import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'sentinel-incident-commander',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    agora: {
      configured: Boolean(process.env.NEXT_PUBLIC_AGORA_APP_ID && process.env.NEXT_AGORA_APP_CERTIFICATE),
    },
  });
}
