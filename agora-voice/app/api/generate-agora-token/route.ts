import { NextRequest, NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';
import { createIncidentId } from '@/lib/session';

const EXPIRATION_TIME_IN_SECONDS = 3600;

function generateChannelName(): string {
  const timestamp = Date.now();
  const random = Math.random()
    .toString(36)
    .substring(2, 8);

  return `ai-conversation-${timestamp}-${random}`;
}

export async function GET(request: NextRequest) {
  const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const APP_CERTIFICATE =
    process.env.NEXT_AGORA_APP_CERTIFICATE;

  if (!APP_ID || !APP_CERTIFICATE) {
    return NextResponse.json(
      {
        error: 'Agora credentials are not set',
      },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);

  const uidStr = searchParams.get('uid');

  const parsedUid = uidStr
    ? parseInt(uidStr, 10)
    : Number.NaN;

  const uid =
    Number.isNaN(parsedUid) || parsedUid <= 0
      ? Math.floor(Math.random() * 9_999_000) + 1000
      : parsedUid;

  const channelName =
    searchParams.get('channel') ||
    generateChannelName();

  /*
   * A new incident is created only when a new channel is created.
   *
   * During token renewal the existing channel is passed back,
   * so the same incident_id remains associated with the session.
   */
  const requestedChannel =
    searchParams.get('channel');

  const incidentId =
    searchParams.get('incidentId') ||
    (requestedChannel
      ? `incident_${requestedChannel}`
      : createIncidentId());

  const expirationTime =
    Math.floor(Date.now() / 1000) +
    EXPIRATION_TIME_IN_SECONDS;

  try {
    const token =
      RtcTokenBuilder.buildTokenWithRtm(
        APP_ID,
        APP_CERTIFICATE,
        channelName,
        uid.toString(),
        RtcRole.PUBLISHER,
        expirationTime,
        expirationTime,
      );

    return NextResponse.json({
      token,
      uid: uid.toString(),
      channel: channelName,
      incidentId,
    });
  } catch (error) {
    console.error(
      'Error generating Agora token:',
      error,
    );

    return NextResponse.json(
      {
        error: 'Failed to generate Agora token',
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 },
    );
  }
}