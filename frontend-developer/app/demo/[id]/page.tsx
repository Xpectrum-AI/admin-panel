"use client";

import { useParams } from "next/navigation";
import AgentDemoPage from "@/app/components/publicLinkPage/AgentDemo";

export default function Page() {
  const { id } = useParams() as { id: string };
  return <AgentDemoPage agentId={id} />;
}