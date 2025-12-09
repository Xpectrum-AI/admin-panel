-- CreateEnum
CREATE TYPE "InteractionMode" AS ENUM ('chat_only', 'call_only', 'both');

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "themeColor" TEXT NOT NULL DEFAULT '#16a34a',
    "logoImage" TEXT,
    "backgroundImage" TEXT,
    "botName" TEXT NOT NULL DEFAULT 'AI Assistant',
    "botIconStyle" TEXT NOT NULL DEFAULT 'bottts',
    "widgetBgColor" TEXT NOT NULL DEFAULT '#ffffff',
    "chatBgColor" TEXT NOT NULL DEFAULT '#f9fafb',
    "userBubbleColor" TEXT NOT NULL DEFAULT '#16a34a',
    "botBubbleColor" TEXT NOT NULL DEFAULT '#ffffff',
    "interactionMode" "InteractionMode" NOT NULL DEFAULT 'both',
    "agentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agent_agentId_key" ON "Agent"("agentId");

-- CreateIndex
CREATE INDEX "Configs_name_idx" ON "Configs"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Configs_agentId_name_key" ON "Configs"("agentId", "name");

-- AddForeignKey
ALTER TABLE "Configs" ADD CONSTRAINT "Configs_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
