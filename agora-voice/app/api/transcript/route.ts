import { NextRequest, NextResponse } from 'next/server';

import {
  createTranscriptEvent,
  sendTranscriptToIntelligence,
} from '@/lib/sentinel';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      incidentId,
      sessionId,
      speakerId,
      speakerName,
      speakerRole,
      text,
      isFinal,
    } = body;

    if (!incidentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'incidentId is required',
        },
        { status: 400 },
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'sessionId is required',
        },
        { status: 400 },
      );
    }

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'text is required',
        },
        { status: 400 },
      );
    }

    const cleanedText = text.trim();

    if (!cleanedText) {
      return NextResponse.json(
        {
          success: false,
          error: 'text cannot be empty',
        },
        { status: 400 },
      );
    }

    const event = createTranscriptEvent({
      incidentId,
      sessionId,
      speakerId: speakerId ?? 'unknown',
      speakerName: speakerName ?? 'Unknown Speaker',
      speakerRole: speakerRole ?? 'unknown',
      text: cleanedText,
      isFinal: isFinal ?? true,
    });

    const result = await sendTranscriptToIntelligence(event);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          event,
          error: result.error,
        },
        {
          status:
            result.status >= 400
              ? result.status
              : 502,
        },
      );
    }

    return NextResponse.json({
      success: true,
      event,
      intelligence: result.data,
    });
  } catch (error) {
    console.error('[Sentinel] Transcript API error:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Internal server error',
      },
      { status: 500 },
    );
  }
}