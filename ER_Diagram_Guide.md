# Complete Entity Relationship (ER) Diagram Guide
## User-Organizations-Agents-Management-Calendar System

### Overview
This comprehensive guide provides the complete ER diagram structure for your multi-tenant admin panel system, including all entities, relationships, and clear explanations based on your actual codebase.

---

## 🏗️ **Complete ER Diagram Structure**

```
                    [USER]
                       ↓ (1:1)
                  [USERTOKEN]
                       ↓ (1:N)
                [CALENDAREVENT]
                       ↑
                       |
[USER] ←→ (M:N) [USERORGANIZATION] ←→ (M:N) [ORGANIZATION]
                       ↓ (1:N)                    ↓ (M:N)
                [PENDINGINVITE]              [ORGANIZATIONAGENT]
                                                      ↓ (1:N)
                                                [AGENT]
                                                      ↓ (1:1)
                                            [AGENTCONFIGURATION]
```

---

## 📊 **Detailed Entity Definitions**

### 1. **USER Entity** (Central Entity)
```
USER {
  user_id (PK) - string                    // Unique user identifier
  email - string                           // User's email address
  first_name - string                      // User's first name
  last_name - string                       // User's last name
  username - string                        // Unique username
  picture_url - string                     // Profile picture URL
  email_confirmed - boolean                // Email verification status
  has_password - boolean                   // Password existence flag
  locked - boolean                         // Account lock status
  enabled - boolean                        // Account active status
  mfa_enabled - boolean                    // Multi-factor authentication
  can_create_orgs - boolean                // Organization creation permission
  created_at - timestamp                   // Account creation date
  last_active_at - timestamp               // Last activity timestamp
  update_password_required - boolean       // Password update requirement
  timezone - string (default: "Asia/Kolkata") // User's timezone
  welcome_form_completed - boolean         // Onboarding completion status
  welcome_form_data - json                 // Onboarding form data
}
```

**Purpose**: Central entity that represents all users in the system. Every user has a unique ID and can belong to multiple organizations.

### 2. **ORGANIZATION Entity** (Multi-tenant Container)
```
ORGANIZATION {
  org_id (PK) - string                    // Unique organization identifier
  name - string                           // Organization name
  display_name - string                   // Display name for UI
  description - string                    // Organization description
  domain - string                         // Primary domain
  extra_domains - array[string]           // Additional domains
  enable_auto_joining_by_domain - boolean // Auto-join by domain
  members_must_have_matching_domain - boolean // Domain restriction
  max_users - integer                     // Maximum user limit
  can_setup_saml - boolean                // SAML setup permission
  legacy_org_id - string                  // Legacy system ID
  created_at - timestamp                  // Creation timestamp
  updated_at - timestamp                  // Last update timestamp
}
```

**Purpose**: Represents organizations/tenants in the multi-tenant system. Each organization can have multiple users and agents.

### 3. **USERORGANIZATION Entity** (Junction Table)
```
USERORGANIZATION {
  user_id (FK) - string                   // References USER.user_id
  org_id (FK) - string                    // References ORGANIZATION.org_id
  role_in_org - string                    // User's role in organization
  additional_roles_in_org - array[string] // Additional roles
  joined_at - timestamp                   // Membership start date
  PRIMARY KEY (user_id, org_id)           // Composite primary key
}
```

**Purpose**: Junction table that manages the many-to-many relationship between users and organizations. Each record represents a user's membership in a specific organization with their role.

### 4. **PENDINGINVITE Entity** (Invitation Management)
```
PENDINGINVITE {
  invite_id (PK) - string                 // Unique invite identifier
  org_id (FK) - string                    // References ORGANIZATION.org_id
  invitee_email - string                  // Invited user's email
  role_in_org - string                    // Assigned role
  additional_roles_in_org - array[string] // Additional roles
  inviter_user_id (FK) - string           // References USER.user_id
  inviter_email - string                  // Inviter's email
  created_at - timestamp                  // Invitation creation date
  expires_at - timestamp                  // Invitation expiration
  status - enum('pending', 'accepted', 'expired') // Invitation status
}
```

**Purpose**: Manages pending invitations for users to join organizations. Tracks who invited whom and when the invitation expires.

### 5. **USERTOKEN Entity** (OAuth Token Management)
```
USERTOKEN {
  user_id (FK) - string                   // References USER.user_id
  access_token - string                   // OAuth access token
  refresh_token - string                  // OAuth refresh token
  token_type - string                     // Token type (Bearer)
  token_expiration - timestamp            // Token expiration time
  client_id - string                      // OAuth client ID
  client_secret - string                  // OAuth client secret
  has_calendar_access - boolean           // Calendar access flag
  scope - array[string]                   // Authorized scopes
  created_at - timestamp                  // Token creation date
  updated_at - timestamp                  // Last update timestamp
  PRIMARY KEY (user_id)                   // One token set per user
}
```

**Purpose**: Stores OAuth tokens for Google Calendar integration. Each user has one set of tokens for calendar access.

### 6. **CALENDAREVENT Entity** (Calendar Management)
```
CALENDAREVENT {
  event_id (PK) - string                  // Unique event identifier
  user_id (FK) - string                   // References USER.user_id
  google_event_id - string                // Google Calendar event ID
  title - string                          // Event title
  description - text                      // Event description
  start_time - timestamp                  // Event start time
  end_time - timestamp                    // Event end time
  timezone - string                       // Event timezone
  location - string                       // Event location
  attendees - array[string]               // Attendee emails
  created_at - timestamp                  // Event creation date
  updated_at - timestamp                  // Last update timestamp
}
```

**Purpose**: Stores calendar events synchronized from Google Calendar. Each event belongs to a specific user.

### 7. **AGENT Entity** (AI Agent Management)
```
AGENT {
  agent_id (PK) - string                  // Unique agent identifier
  name - string                           // Agent name
  phone_number - string                   // Agent's phone number
  chatbot_api - string                    // Chatbot API endpoint
  chatbot_key - string                    // Chatbot API key
  initial_message - string                // Default greeting message
  created_at - timestamp                  // Agent creation date
  updated_at - timestamp                  // Last update timestamp
  status - enum('active', 'inactive', 'deleted') // Agent status
}
```

**Purpose**: Represents AI agents/chatbots that can be managed by organizations. Each agent has specific configuration and capabilities.

### 8. **AGENTCONFIGURATION Entity** (Agent Settings)
```
AGENTCONFIGURATION {
  agent_id (FK) - string                  // References AGENT.agent_id
  tts_config - json {                     // Text-to-Speech settings
    voice_id - string                     // TTS voice identifier
    tts_api_key - string                  // TTS API key
    model - string                        // TTS model name
    speed - float                         // Speech speed (0.5-2.0)
    language - string                     // Speech language
  }
  stt_config - json {                     // Speech-to-Text settings
    api_key - string                      // STT API key
    model - string                        // STT model name
    language - string                     // STT language
  }
  PRIMARY KEY (agent_id)                  // One config per agent
}
```

**Purpose**: Stores detailed configuration for each agent's TTS (Text-to-Speech) and STT (Speech-to-Text) capabilities.

### 9. **ORGANIZATIONAGENT Entity** (Junction Table)
```
ORGANIZATIONAGENT {
  org_id (FK) - string                    // References ORGANIZATION.org_id
  agent_id (FK) - string                  // References AGENT.agent_id
  created_at - timestamp                  // Association creation date
  updated_at - timestamp                  // Last update timestamp
  PRIMARY KEY (org_id, agent_id)          // Composite primary key
}
```

**Purpose**: Junction table that manages which agents belong to which organizations. Enables organizations to have multiple agents.

---

## 🔗 **Relationship Explanations**

### **One-to-One Relationships (1:1)**
1. **USER → USERTOKEN**
   - Each user has exactly one set of OAuth tokens
   - Foreign key: `USERTOKEN.user_id` references `USER.user_id`

2. **AGENT → AGENTCONFIGURATION**
   - Each agent has exactly one configuration
   - Foreign key: `AGENTCONFIGURATION.agent_id` references `AGENT.agent_id`

### **One-to-Many Relationships (1:N)**
1. **USER → CALENDAREVENT**
   - One user can have many calendar events
   - Foreign key: `CALENDAREVENT.user_id` references `USER.user_id`

2. **ORGANIZATION → PENDINGINVITE**
   - One organization can have many pending invites
   - Foreign key: `PENDINGINVITE.org_id` references `ORGANIZATION.org_id`

3. **USER → PENDINGINVITE** (as inviter)
   - One user can create many invites
   - Foreign key: `PENDINGINVITE.inviter_user_id` references `USER.user_id`

4. **ORGANIZATION → ORGANIZATIONAGENT**
   - One organization can have many agent associations
   - Foreign key: `ORGANIZATIONAGENT.org_id` references `ORGANIZATION.org_id`

5. **AGENT → ORGANIZATIONAGENT**
   - One agent can belong to many organizations
   - Foreign key: `ORGANIZATIONAGENT.agent_id` references `AGENT.agent_id`

### **Many-to-Many Relationships (M:N)**
1. **USER ↔ ORGANIZATION**
   - Many users can belong to many organizations
   - Junction table: `USERORGANIZATION`
   - Foreign keys: `USERORGANIZATION.user_id` and `USERORGANIZATION.org_id`

2. **ORGANIZATION ↔ AGENT**
   - Many organizations can have many agents
   - Junction table: `ORGANIZATIONAGENT`
   - Foreign keys: `ORGANIZATIONAGENT.org_id` and `ORGANIZATIONAGENT.agent_id`

---

## 🎯 **System Architecture Explanation**

### **Multi-Tenant Design**
- **Organizations** are the main tenants
- Each **User** can belong to multiple organizations
- **Agents** are shared across organizations via junction tables
- **Calendar events** are user-specific but within organizational context

### **Authentication & Authorization Flow**
1. **User** authenticates via PropelAuth
2. **UserToken** stores OAuth credentials for Google Calendar
3. **UserOrganization** defines user roles and permissions
4. **PendingInvite** manages organization invitations

### **Agent Management Flow**
1. **Organization** creates/assigns **Agents**
2. **AgentConfiguration** stores TTS/STT settings
3. **OrganizationAgent** links agents to organizations
4. Users can access agents based on their organization membership

### **Calendar Integration Flow**
1. **User** grants Google Calendar access
2. **UserToken** stores OAuth tokens
3. **CalendarEvent** syncs events from Google Calendar
4. Events are user-specific but visible within organizational context

---

## 🛠️ **Database Implementation**

### **MongoDB Collections** (Current Implementation)
```javascript
// Users collection
users: {
  user_id: string,
  email: string,
  first_name: string,
  last_name: string,
  timezone: string,
  welcome_form_completed: boolean,
  welcome_form_data: object,
  access_token: string,
  refresh_token: string,
  has_calendar_access: boolean,
  scope: array,
  created_at: date,
  updated_at: date
}

// Organizations (managed by PropelAuth)
// Agents (external service)
// Calendar events (Google Calendar API)
```

### **SQL Alternative** (If migrating)
```sql
-- Users table
CREATE TABLE users (
    user_id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    username VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    welcome_form_completed BOOLEAN DEFAULT FALSE,
    welcome_form_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Organizations table
CREATE TABLE organizations (
    org_id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    description TEXT,
    domain VARCHAR(255),
    max_users INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User-Organization relationship
CREATE TABLE user_organizations (
    user_id VARCHAR(255),
    org_id VARCHAR(255),
    role_in_org VARCHAR(50) NOT NULL,
    additional_roles_in_org JSON,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, org_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (org_id) REFERENCES organizations(org_id)
);

-- User tokens for OAuth
CREATE TABLE user_tokens (
    user_id VARCHAR(255) PRIMARY KEY,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    token_expiration TIMESTAMP,
    client_id VARCHAR(255),
    client_secret VARCHAR(255),
    has_calendar_access BOOLEAN DEFAULT FALSE,
    scope JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Calendar events
CREATE TABLE calendar_events (
    event_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    google_event_id VARCHAR(255),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    timezone VARCHAR(50),
    location VARCHAR(500),
    attendees JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Agents
CREATE TABLE agents (
    agent_id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    chatbot_api VARCHAR(500),
    chatbot_key VARCHAR(255),
    initial_message TEXT,
    status ENUM('active', 'inactive', 'deleted') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Agent configurations
CREATE TABLE agent_configurations (
    agent_id VARCHAR(255) PRIMARY KEY,
    tts_config JSON,
    stt_config JSON,
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id)
);

-- Organization-Agent relationship
CREATE TABLE organization_agents (
    org_id VARCHAR(255),
    agent_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (org_id, agent_id),
    FOREIGN KEY (org_id) REFERENCES organizations(org_id),
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id)
);

-- Pending invites
CREATE TABLE pending_invites (
    invite_id VARCHAR(255) PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    invitee_email VARCHAR(255) NOT NULL,
    role_in_org VARCHAR(50) NOT NULL,
    additional_roles_in_org JSON,
    inviter_user_id VARCHAR(255),
    inviter_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    status ENUM('pending', 'accepted', 'expired') DEFAULT 'pending',
    FOREIGN KEY (org_id) REFERENCES organizations(org_id),
    FOREIGN KEY (inviter_user_id) REFERENCES users(user_id)
);
```

---

## 📋 **Step-by-Step ER Diagram Creation**

### **Step 1: Draw Core Entities**
1. Place **USER** in the center
2. Add **ORGANIZATION** to the right
3. Add **AGENT** below organization
4. Add **CALENDAREVENT** below user

### **Step 2: Add Junction Tables**
1. Add **USERORGANIZATION** between USER and ORGANIZATION
2. Add **ORGANIZATIONAGENT** between ORGANIZATION and AGENT

### **Step 3: Add Supporting Entities**
1. Add **USERTOKEN** connected to USER
2. Add **PENDINGINVITE** connected to ORGANIZATION
3. Add **AGENTCONFIGURATION** connected to AGENT

### **Step 4: Draw Relationships**
1. Use solid lines for direct relationships
2. Use dashed lines for conceptual relationships
3. Add cardinality notation (1:1, 1:N, M:N)
4. Label relationships clearly

### **Step 5: Add Attributes**
1. List primary keys (PK) and foreign keys (FK)
2. Include important attributes for each entity
3. Mark required vs optional attributes
4. Add data types and constraints

---

## 🎨 **Recommended Tools**

### **Free Tools:**
1. **Draw.io** (diagrams.net) - Best free option
2. **dbdiagram.io** - Database-focused
3. **Lucidchart** - Free tier available
4. **ERDPlus** - Simple and effective

### **Professional Tools:**
1. **Lucidchart** - Full features
2. **Visio** - Microsoft Office integration
3. **Enterprise Architect** - Advanced modeling
4. **MySQL Workbench** - Database-specific

---

## ✅ **Validation Checklist**

Before finalizing your ER diagram, ensure:

- [ ] All entities from your codebase are included
- [ ] Primary keys are properly marked
- [ ] Foreign key relationships are correct
- [ ] Cardinality is accurately represented
- [ ] Junction tables are properly placed
- [ ] Attributes include data types
- [ ] Relationships are clearly labeled
- [ ] Diagram is readable and organized

---

## 🚀 **Next Steps**

1. **Choose your preferred tool** from the recommendations
2. **Start with the core entities** (USER, ORGANIZATION, AGENT)
3. **Add junction tables** for many-to-many relationships
4. **Include all attributes** with proper data types
5. **Review relationships** for accuracy
6. **Share with your team** for feedback
7. **Document any assumptions** or constraints
8. **Version control** your diagram for future updates

This comprehensive ER diagram will serve as the foundation for understanding your system's data architecture and can be used for database design, API documentation, and system documentation.