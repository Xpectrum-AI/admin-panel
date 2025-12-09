import { NextResponse } from 'next/server';
import { InteractionMode } from '@/lib/generated/prisma/client'
import { prisma } from '@/db/prisma';


const isValidInteractionMode = (mode: string): mode is InteractionMode => {
  return ['chat_only', 'call_only', 'both'].includes(mode);
};


export async function GET(
  request: Request,
  props: { params: Promise<{ agentId: string }> }
) {
  try {
    const params = await props.params;
    const { agentId } = params;
    
    const { searchParams } = new URL(request.url);
    const configName = searchParams.get('configName');

    if (!agentId || !configName) {
      return NextResponse.json(
        { error: 'Agent ID and Config Name are required' },
        { status: 400 }
      );
    }


    const agent = await prisma.agent.findUnique({
      where: { agentId: agentId },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const config = await prisma.configs.findUnique({
      where: {
        agentId_name: {
          agentId: agent.id,
          name: configName,
        },
      },
    });

    if (!config) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    return NextResponse.json({ status: 'success', config });
  } catch (error) {
    console.error('Error fetching config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


export async function POST(
  request: Request,
  props: { params: Promise<{ agentId: string }> }
) {
  try {

    const params = await props.params;
    const { agentId } = params;
    
    const body = await request.json();

    const {
      configName,
      themeColor,
      logoImage,
      backgroundImage,
      botName,
      botIconStyle,
      widgetBackgroundColor,
      messageAreaBackgroundColor,
      userBubbleColor,
      botBubbleColor,
      interactionMode
    } = body;

    let agent : any;

    if (!configName) {
      return NextResponse.json({ error: 'Configuration name is required' }, { status: 400 });
    }

     agent = await prisma.agent.findUnique({
      where: { agentId: agentId },
    });

    if (!agent) {
    //   return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    agent = await prisma.agent.create({
        data: {
          agentId: agentId}
    });
    }

    const newConfig = await prisma.configs.create({
      data: {
        name: configName,
        agentId: agent.id,
        themeColor,
        logoImage,
        backgroundImage,
        botName,
        botIconStyle,
        widgetBgColor: widgetBackgroundColor,
        chatBgColor: messageAreaBackgroundColor,
        userBubbleColor,
        botBubbleColor,
        interactionMode: isValidInteractionMode(interactionMode) 
          ? interactionMode 
          : InteractionMode.both,
      },
    });

    return NextResponse.json({ status: 'success', config: newConfig });

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