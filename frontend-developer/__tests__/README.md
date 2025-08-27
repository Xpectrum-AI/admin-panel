# Frontend Developer Tests

This directory contains comprehensive tests for the Developer Dashboard frontend application.

## Test Structure

```
__tests__/
├── components/           # Component unit tests
│   ├── developer/       # Developer dashboard components
│   └── common/          # Common/shared components
├── pages/               # Page component tests
├── hooks/               # Custom hooks tests
├── service/             # Service layer tests
├── integration/         # Integration tests
└── utils/               # Test utilities and helpers
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- AgentsTab.test.tsx
```

## Test Categories

### Unit Tests
- **Components**: Individual component testing with mocked dependencies
- **Hooks**: Custom React hooks testing
- **Services**: API service layer testing
- **Utils**: Utility function testing

### Integration Tests
- **User Flows**: End-to-end user journey testing
- **API Integration**: Real API interaction testing
- **Authentication**: Auth flow testing

## Test Patterns

### Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { AgentsTab } from '@/app/developer/components/AgentsTab'

describe('AgentsTab', () => {
  it('renders agent list correctly', () => {
    render(<AgentsTab />)
    expect(screen.getByText('Agents')).toBeInTheDocument()
  })
})
```

### Service Testing
```typescript
import { agentService } from '@/service/agentService'

describe('agentService', () => {
  it('fetches agents successfully', async () => {
    const agents = await agentService.getAgents()
    expect(agents).toBeDefined()
  })
})
```

## Mocking Strategy

- **External APIs**: Mocked with jest.mock()
- **Authentication**: PropelAuth mocked in jest.setup.js
- **Router**: Next.js router mocked for navigation testing
- **Local Storage**: Browser APIs mocked for persistence testing

## Coverage Goals

- **Components**: 80%+ coverage
- **Services**: 90%+ coverage
- **Hooks**: 85%+ coverage
- **Overall**: 80%+ coverage
