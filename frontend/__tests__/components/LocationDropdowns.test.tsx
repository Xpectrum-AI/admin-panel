import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Simple test component to verify testing setup
const TestComponent = ({ title, required = false }: { title: string; required?: boolean }) => {
  return (
    <div>
      <h1>{title}</h1>
      {required && <span data-testid="required">*</span>}
    </div>
  )
}

describe('Testing Setup Verification', () => {
  it('renders a simple component correctly', () => {
    render(<TestComponent title="Test Title" />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('shows required indicator when required prop is true', () => {
    render(<TestComponent title="Test Title" required={true} />)
    expect(screen.getByTestId('required')).toBeInTheDocument()
  })

  it('does not show required indicator when required prop is false', () => {
    render(<TestComponent title="Test Title" required={false} />)
    expect(screen.queryByTestId('required')).not.toBeInTheDocument()
  })

  it('can find elements by text content', () => {
    render(<TestComponent title="Hello World" />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })
})
