# System Flow Presentation
## User-Organizations-Agents-Management-Calendar System

---

## 🎯 **System Overview**

Our system is a **multi-tenant admin panel** that manages:
- **Users** and their authentication
- **Organizations** (multi-tenant containers)
- **AI Agents** (chatbots with TTS/STT capabilities)
- **Calendar Integration** (Google Calendar sync)

---

## 🏗️ **Core Architecture Flow**

### **1. User Authentication & Onboarding**
```
User Registration → PropelAuth → Welcome Form → Organization Setup
```

**Step-by-step:**
1. **User signs up** via PropelAuth (Google OAuth)
2. **System creates user** with unique ID and profile
3. **Welcome form** collects additional information (timezone, preferences)
4. **User joins/creates organization** or gets invited

**Key Entities:**
- `USER` - Central user entity
- `USERTOKEN` - OAuth tokens for calendar access
- `PENDINGINVITE` - Organization invitations

---

### **2. Multi-Tenant Organization Management**
```
Organization Creation → User Invitations → Role Assignment → Access Control
```

**Step-by-step:**
1. **Organization admin** creates organization
2. **Invites users** via email with specific roles
3. **Users accept invitations** and join organization
4. **Role-based access** controls what users can do

**Key Entities:**
- `ORGANIZATION` - Multi-tenant container
- `USERORGANIZATION` - User membership and roles
- `PENDINGINVITE` - Invitation management

---

### **3. AI Agent Management**
```
Agent Creation → Configuration → Organization Assignment → Phone Setup
```

**Step-by-step:**
1. **Organization creates agents** (AI chatbots)
2. **Configure TTS/STT settings** (voice, language, speed)
3. **Assign agents to organization** via junction table
4. **Set up phone numbers** for voice interactions

**Key Entities:**
- `AGENT` - AI chatbot entity
- `AGENTCONFIGURATION` - TTS/STT settings
- `ORGANIZATIONAGENT` - Organization-agent relationships

---

### **4. Calendar Integration**
```
Google OAuth → Token Storage → Event Sync → Calendar Management
```

**Step-by-step:**
1. **User grants Google Calendar access** via OAuth
2. **System stores OAuth tokens** securely
3. **Syncs calendar events** from Google Calendar
4. **Manages events** within organizational context

**Key Entities:**
- `USERTOKEN` - OAuth token storage
- `CALENDAREVENT` - Calendar event management

---

## 🔄 **Data Flow Diagram**

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   USER      │    │ ORGANIZATION │    │    AGENT    │
│             │    │              │    │             │
│ • Profile   │◄──►│ • Settings   │◄──►│ • Chatbot   │
│ • Auth      │    │ • Members    │    │ • TTS/STT   │
│ • Calendar  │    │ • Agents     │    │ • Phone     │
└─────────────┘    └──────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ USERTOKEN   │    │USERORGANIZATION│   │AGENTCONFIG  │
│ • OAuth     │    │ • Roles       │   │ • Voice     │
│ • Calendar  │    │ • Permissions │   │ • Language  │
└─────────────┘    └──────────────┘    └─────────────┘
       │
       ▼
┌─────────────┐
│CALENDAREVENT│
│ • Events    │
│ • Sync      │
└─────────────┘
```

---

## 🎯 **Key Business Flows**

### **Flow 1: New User Onboarding**
```
1. User signs up with Google OAuth
2. Completes welcome form (timezone, preferences)
3. Gets invited to organization or creates new one
4. Sets up calendar integration (optional)
5. Gains access to organization's agents
```

### **Flow 2: Organization Management**
```
1. Admin creates organization
2. Invites team members with specific roles
3. Assigns agents to organization
4. Configures agent settings (TTS/STT)
5. Sets up phone numbers for voice interactions
```

### **Flow 3: Agent Operations**
```
1. Organization creates AI agent
2. Configures TTS (Text-to-Speech) settings
3. Configures STT (Speech-to-Text) settings
4. Assigns phone number for voice calls
5. Agent becomes available for user interactions
```

### **Flow 4: Calendar Integration**
```
1. User grants Google Calendar access
2. System stores OAuth tokens securely
3. Syncs existing calendar events
4. Allows event creation/management
5. Maintains calendar within organizational context
```

---

## 🔐 **Security & Access Control**

### **Multi-Tenant Security**
- **Organizations are isolated** - Users can't access other organizations
- **Role-based permissions** - Different access levels within organization
- **OAuth token security** - Encrypted storage of Google tokens

### **Authentication Flow**
```
User Login → PropelAuth Verification → JWT Token → API Access
```

### **Authorization Matrix**
| Role | Users | Agents | Calendar | Settings |
|------|-------|--------|----------|----------|
| Admin | Full | Full | Full | Full |
| Manager | View | Full | Full | Limited |
| Member | View | Limited | Own | None |

---

## 📊 **Database Relationships**

### **One-to-One Relationships**
- **USER → USERTOKEN** (One user, one OAuth token set)
- **AGENT → AGENTCONFIGURATION** (One agent, one config)

### **One-to-Many Relationships**
- **USER → CALENDAREVENT** (One user, many events)
- **ORGANIZATION → PENDINGINVITE** (One org, many invites)

### **Many-to-Many Relationships**
- **USER ↔ ORGANIZATION** (Many users, many organizations)
- **ORGANIZATION ↔ AGENT** (Many orgs, many agents)

---

## 🚀 **Technical Implementation**

### **Backend Services**
- **Node.js/Express** - Main API server
- **Python/FastAPI** - Calendar backend
- **MongoDB** - User data and tokens
- **PropelAuth** - Authentication service

### **Frontend**
- **Next.js/React** - Admin panel interface
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

### **External Integrations**
- **Google Calendar API** - Calendar sync
- **LiveKit** - Agent voice services
- **PropelAuth** - User authentication

---

## 📈 **System Benefits**

### **For Organizations**
- **Multi-tenant isolation** - Secure, separate workspaces
- **Scalable agent management** - Easy agent creation and configuration
- **Role-based access** - Granular permissions
- **Calendar integration** - Seamless scheduling

### **For Users**
- **Single sign-on** - Google OAuth integration
- **Multi-organization support** - Join multiple organizations
- **Calendar sync** - Automatic Google Calendar integration
- **Voice agent access** - TTS/STT capabilities

### **For Developers**
- **Clean architecture** - Well-defined entities and relationships
- **Scalable design** - Easy to add new features
- **Security-first** - Proper authentication and authorization
- **API-first** - RESTful APIs for all operations

---

## 🔄 **Data Flow Summary**

1. **User Authentication** → PropelAuth handles login
2. **Organization Management** → Users join organizations with roles
3. **Agent Configuration** → Organizations create and configure AI agents
4. **Calendar Integration** → Users sync their Google Calendar
5. **Access Control** → Role-based permissions throughout the system

---

## 💡 **Key Takeaways**

- **Multi-tenant architecture** with organization-based isolation
- **Comprehensive user management** with role-based access
- **AI agent system** with TTS/STT capabilities
- **Google Calendar integration** for scheduling
- **Secure OAuth token management** for external services
- **Scalable design** that can grow with business needs

This system provides a complete solution for managing users, organizations, AI agents, and calendar functionality in a secure, scalable, and user-friendly way.