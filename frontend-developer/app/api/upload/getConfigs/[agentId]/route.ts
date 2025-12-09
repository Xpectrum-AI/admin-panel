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
    

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID required' },
        { status: 400 }
      );
    }


    const agent = await prisma.agent.findUnique({
      where: { agentId: agentId },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const config = await prisma.agent.findUnique({
      where: {
        agentId
      },select : {
        configs : {
            select :{
                name : true
            }
        }
      }
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