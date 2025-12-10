import { DecryptToken, EncryptToken } from '@/app/components/utils/jwt';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
) {
  try {
    const body = await request.json();

    const {
      themeColor,
      logoImage,
      backgroundImage,
      botName,
      botIconStyle,
      widgetBackgroundColor,
      messageAreaBackgroundColor,
      userBubbleColor,
      botBubbleColor,
      interactionMode,
      botIcon
    } = body;

   const payload = {
        themeColor : themeColor,
        logoImage : logoImage,
        backgroundImage : backgroundImage,
        botName : botName,
        botIconStyle : botIconStyle,
        widgetBackgroundColor   : widgetBackgroundColor,
        messageAreaBackgroundColor  : messageAreaBackgroundColor,
        userBubbleColor : userBubbleColor,
        botBubbleColor : botBubbleColor,
        interactionMode : interactionMode,
        botIcon : botIcon
   }
   const token = EncryptToken(payload)

    return NextResponse.json({ status: 'success', token : token });

  } catch (error: any) {
    console.error('Error saving config:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A configuration with this name already exists for this agent.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


export async function GET(
  request: Request,
) {
  try {
    const { searchParams } = new URL(request.url);
    const configName = searchParams.get('configName');
    
    if (!configName) {
      return NextResponse.json(
        { error: 'Configuration name required' },
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
    console.error('Error fetching config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}