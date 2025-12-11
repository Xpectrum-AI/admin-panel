import { DecryptToken, EncryptToken } from '@/app/components/utils/jwt';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { config } = body;

    const payload = {
      themeColor: config.themeColor,
      backgroundImage: config.backgroundImage,
      botName: config.botName,
      botIconStyle: config.botIconStyle,
      botIcon: config.botIcon,
      widgetBackgroundColor: config.widgetBackgroundColor,
      messageAreaBackgroundColor: config.messageAreaBackgroundColor,
      userBubbleColor: config.userBubbleColor,
      botBubbleColor: config.botBubbleColor,
      userTextColor: config.userTextColor,
      botTextColor: config.botTextColor,
      interactionMode: config.interactionMode
    };

    const token = EncryptToken(payload);

    return NextResponse.json({ status: 'success', token });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const configName = searchParams.get('configName');

    if (!configName) {
      return NextResponse.json(
        { error: 'Configuration token required' },
        { status: 400 }
      );
    }

    const decoded = DecryptToken(configName);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid configuration token' },
        { status: 400 }
      );
    }

    return NextResponse.json({ status: 'success', config: decoded });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}