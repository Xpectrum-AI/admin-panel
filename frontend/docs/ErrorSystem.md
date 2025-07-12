# Error System Documentation

## Overview

The application includes a comprehensive error management system that displays popup notifications in the top-left corner of the screen. This system provides a consistent way to show errors, warnings, success messages, and informational notifications across the entire application.

## Features

- **Multiple Message Types**: Error, Warning, Success, and Info
- **Auto-dismiss**: Messages automatically disappear after a configurable duration (default: 5 seconds)
- **Manual Dismiss**: Users can manually close messages by clicking the X button
- **Stacked Notifications**: Multiple messages can be displayed simultaneously
- **Smooth Animations**: Slide-in animation from the left
- **Responsive Design**: Works on all screen sizes

## Usage

### Basic Usage

```tsx
import { useErrorHandler } from '../hooks/useErrorHandler';

function MyComponent() {
  const { showError, showSuccess, showWarning, showInfo } = useErrorHandler();

  const handleSubmit = async () => {
    try {
      // Your logic here
      showSuccess('Operation completed successfully!');
    } catch (error) {
      showError('Something went wrong!');
    }
  };

  return (
    <button onClick={handleSubmit}>
      Submit
    </button>
  );
}
```

### Advanced Usage

```tsx
import { useError } from '../contexts/ErrorContext';

function MyComponent() {
  const { showError } = useError();

  const handleCustomError = () => {
    // Custom duration (2 seconds)
    showError('This will disappear in 2 seconds', 'error', 2000);
    
    // Or disable auto-dismiss
    showError('This will stay until manually closed', 'error', 0);
  };
}
```

## API Reference

### useErrorHandler Hook

Provides convenient methods for different message types:

- `showError(message: string, duration?: number)` - Shows an error message
- `showSuccess(message: string, duration?: number)` - Shows a success message
- `showWarning(message: string, duration?: number)` - Shows a warning message
- `showInfo(message: string, duration?: number)` - Shows an informational message

### useError Hook (Direct Context)

Provides direct access to the error context:

- `showError(message: string, type: 'error' | 'warning' | 'success' | 'info', duration?: number)`
- `clearError(id: string)` - Manually clear a specific error
- `clearAllErrors()` - Clear all errors

## Message Types

| Type | Color | Icon | Use Case |
|------|-------|------|----------|
| Error | Red | X | Critical errors, failed operations |
| Warning | Yellow | Triangle | Warnings, potential issues |
| Success | Green | Checkmark | Successful operations |
| Info | Blue | Info | General information |

## Styling

The error popups are styled with Tailwind CSS and include:

- Fixed positioning in top-left corner
- Z-index of 50 to appear above other content
- Responsive design with max-width
- Smooth slide-in animation
- Hover effects on close button

## Examples

### Form Validation

```tsx
const handleFormSubmit = async (formData) => {
  if (!formData.email) {
    showError('Email is required');
    return;
  }
  
  if (!formData.password) {
    showError('Password is required');
    return;
  }
  
  try {
    await submitForm(formData);
    showSuccess('Form submitted successfully!');
  } catch (error) {
    showError('Failed to submit form. Please try again.');
  }
};
```

### API Error Handling

```tsx
const handleApiCall = async () => {
  try {
    const response = await api.getData();
    showSuccess('Data loaded successfully!');
  } catch (error) {
    if (error.status === 404) {
      showWarning('Data not found');
    } else if (error.status === 500) {
      showError('Server error. Please try again later.');
    } else {
      showError('An unexpected error occurred.');
    }
  }
};
```

### User Feedback

```tsx
const handleUserAction = () => {
  showInfo('Processing your request...');
  
  // After processing
  showSuccess('Action completed successfully!');
};
```

## Best Practices

1. **Be Specific**: Provide clear, actionable error messages
2. **Use Appropriate Types**: Choose the right message type for the situation
3. **Don't Overuse**: Avoid showing too many notifications at once
4. **Handle Edge Cases**: Always provide fallback error messages
5. **Test User Experience**: Ensure messages are helpful and not annoying

## Customization

To customize the error system, you can modify:

- `frontend/app/contexts/ErrorContext.tsx` - Core functionality
- `frontend/app/globals.css` - Animations and styling
- `frontend/app/hooks/useErrorHandler.ts` - Utility methods 