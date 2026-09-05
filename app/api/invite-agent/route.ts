import { NextRequest, NextResponse } from 'next/server';
import {
  AgoraClient,
  Agent,
  Area,
  DeepgramSTT,
  ExpiresIn,
  MiniMaxTTS,
  OpenAI,
} from 'agora-agents';

import {
  ClientStartRequest,
  AgentResponse,
} from '@/types/conversation';

import { DEFAULT_AGENT_UID } from '@/lib/agora';

const SENTINEL_PROMPT = `You are Sentinel, an AI incident response assistant.

You participate in a live production incident room.

Your job is to assist incident responders during active incidents.

CORE RESPONSIBILITIES

- Listen carefully to incident responders.
- Help clarify important information.
- Summarize important information when useful.
- Help identify missing information.
- Help responders communicate clearly.
- Help coordinate incident response.
- Keep responses concise during an active incident.

TRUTH AND UNCERTAINTY

- Never invent facts.
- Never fabricate evidence.
- Never claim a root cause is confirmed without sufficient evidence.
- Clearly distinguish observations from assumptions.
- Treat hypotheses as hypotheses.
- If responders disagree, acknowledge the conflict.
- Do not turn an assumption into a confirmed fact.
- Do not hide uncertainty.
- Never claim an action was completed unless someone confirms it.

CONVERSATION STYLE

- Be calm and precise.
- Be operationally useful.
- Prefer short responses because this is a live voice conversation.
- Ask one focused clarification question at a time.
- Do not overwhelm responders with long explanations.
- Do not lecture.
- Focus on the next useful step.

IMPORTANT

The Incident Intelligence system maintains the official incident state.

You assist responders conversationally.

You do not independently declare the root cause.

You do not override evidence or incident state.

When information is uncertain, explicitly say that it is uncertain.`;

const GREETING =
  `Hi, I'm Sentinel. I'm here to assist with the incident. ` +
  `What are we seeing right now?`;

const agentUid = String(DEFAULT_AGENT_UID);

function getEnvWithFallback(primary: string, fallback: string): string {
  const value = process.env[primary] || process.env[fallback];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${primary} (or ${fallback})`,
    );
  }
  return value;
}

export async function POST(
  request: NextRequest,
) {
  try {
    const body: ClientStartRequest =
      await request.json();

    const {
      requester_id,
      channel_name,
    } = body;

    const appId = getEnvWithFallback(
      'NEXT_PUBLIC_AGORA_APP_ID',
      'AGORA_APP_ID',
    );

    const appCertificate = getEnvWithFallback(
      'NEXT_AGORA_APP_CERTIFICATE',
      'AGORA_APP_CERTIFICATE',
    );


    if (!channel_name || !requester_id) {
      return NextResponse.json(
        {
          error:
            'channel_name and requester_id are required',
        },
        { status: 400 },
      );
    }

    const client = new AgoraClient({
      area: Area.US,
      appId,
      appCertificate,
    });

    const agent = new Agent({
      client,

      instructions: SENTINEL_PROMPT,

      greeting: GREETING,

      failureMessage:
        'I am having trouble processing that right now. Please try again.',

      maxHistory: 50,

      turnDetection: {
        config: {
          speech_threshold: 0.5,

          start_of_speech: {
            mode: 'vad',

            vad_config: {
              interrupt_duration_ms: 160,
              prefix_padding_ms: 300,
            },
          },

          end_of_speech: {
            mode: 'vad',

            vad_config: {
              silence_duration_ms: 480,
            },
          },
        },
      },

      advancedFeatures: {
        enable_rtm: true,
        enable_tools: true,
      },

      parameters: {
        audio_scenario: 'chorus',
        data_channel: 'rtm',
        enable_error_message: true,
        enable_metrics: true,
      },
    })
      .withStt(
        new DeepgramSTT({
          model: 'nova-3',
          language: 'en',
        }),
      )
      .withLlm(
        new OpenAI({
          model: 'gpt-4o-mini',
          greetingMessage: GREETING,
          failureMessage:
            'I am having trouble processing that right now.',
          maxHistory: 15,
          params: {
            max_tokens: 1024,
            temperature: 0.7,
            top_p: 0.95,
          },
        }),
      )
      .withTts(
        new MiniMaxTTS({
          model: 'speech_2_6_turbo',
          voiceId:
            'English_captivating_female1',
        }),
      );

    const session = agent.createSession({
      channel: channel_name,
      agentUid,
      remoteUids: [requester_id],
      idleTimeout: 30,
      expiresIn: ExpiresIn.hours(1),
      debug: false,
    });

    const agentId =
      await session.start();

    return NextResponse.json({
      agent_id: agentId,
      create_ts: Math.floor(
        Date.now() / 1000,
      ),
      state: 'RUNNING',
    } as AgentResponse);
  } catch (error) {
    console.error(
      'Error starting Sentinel:',
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to start Sentinel',
      },
      { status: 500 },
    );
  }
}