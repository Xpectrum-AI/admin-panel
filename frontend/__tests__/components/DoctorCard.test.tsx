import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import DoctorCard from '../../app/(admin)/components/dashboard/DoctorCard'

// Mock the useErrorHandler hook
const mockShowWarning = jest.fn()
jest.mock('../../hooks/useErrorHandler', () => ({
  useErrorHandler: () => ({
    showWarning: mockShowWarning,
  }),
}))

describe('DoctorCard', () => {
  const mockDoctor = {
    _id: '1',
    doctor_id: 'DOC001',
    first_name: 'John',
    last_name: 'Doe',
    organization_id: 'ORG001',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    doctor_data: {
      gender: 'Male',
      age: '35',
      experience: '10 years',
      phone: '+1234567890',
      registration_number: 'REG123456',
      registration_year: '2014',
      registration_state: 'California',
      registration_country: 'USA',
      registration_board: 'Medical Board',
      qualifications: [
        {
          degree: 'MD',
          university: 'Stanford University',
          year: '2014',
          place: 'Stanford, CA'
        }
      ],
      specializations: [
        {
          specialization: 'Cardiology',
          level: 'Expert'
        },
        {
          specialization: 'Internal Medicine',
          level: 'Advanced'
        }
      ],
      aliases: ['Dr. J. Doe'],
      facilities: [
        {
          name: 'Stanford Medical Center',
          type: 'Hospital',
          area: 'Downtown',
          city: 'Stanford',
          state: 'CA',
          pincode: '94305',
          address: '123 Medical Drive'
        }
      ]
    }
  }

  const mockCalendars = [
    {
      doctor_id: 'DOC001',
      calendar_id: 'CAL001',
      name: 'Dr. Doe Calendar'
    }
  ]

  const defaultProps = {
    doctor: mockDoctor,
    onEdit: jest.fn(),
    onAssignCalendar: jest.fn(),
    onDelete: jest.fn(),
    onViewDetails: jest.fn(),
    calendars: []
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders doctor information correctly', () => {
    render(<DoctorCard {...defaultProps} />)

    expect(screen.getByText('Dr. John Doe')).toBeInTheDocument()
    expect(screen.getByText('+1234567890')).toBeInTheDocument()
    expect(screen.getByText('Cardiology')).toBeInTheDocument()
    expect(screen.getByText('Stanford Medical Center')).toBeInTheDocument()
  })

  it('shows calendar assigned status when doctor has calendar', () => {
    render(<DoctorCard {...defaultProps} calendars={mockCalendars} />)

    expect(screen.getByText('Calendar assigned')).toBeInTheDocument()
    expect(screen.getByText('Assigned')).toBeInTheDocument()
    expect(screen.getByText('Calendar Assigned')).toBeInTheDocument()
  })

  it('shows calendar unassigned status when doctor has no calendar', () => {
    render(<DoctorCard {...defaultProps} />)

    expect(screen.getByText('No calendar assigned')).toBeInTheDocument()
    expect(screen.getByText('Unassigned')).toBeInTheDocument()
    expect(screen.getByText('Assign Calendar')).toBeInTheDocument()
  })

  it('calls onViewDetails when card is clicked', () => {
    render(<DoctorCard {...defaultProps} />)

    const card = screen.getByText('Dr. John Doe').closest('div')
    fireEvent.click(card!)

    expect(defaultProps.onViewDetails).toHaveBeenCalledWith(mockDoctor)
  })

  it('calls onEdit when edit button is clicked', () => {
    render(<DoctorCard {...defaultProps} />)

    const editButton = screen.getByText('Edit')
    fireEvent.click(editButton)

    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockDoctor)
  })

  it('calls onDelete when delete button is clicked', () => {
    render(<DoctorCard {...defaultProps} />)

    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)

    expect(defaultProps.onDelete).toHaveBeenCalledWith(mockDoctor)
  })

  it('calls onAssignCalendar when assign calendar button is clicked for doctor without calendar', () => {
    render(<DoctorCard {...defaultProps} />)

    const assignButton = screen.getByText('Assign Calendar')
    fireEvent.click(assignButton)

    expect(defaultProps.onAssignCalendar).toHaveBeenCalledWith(mockDoctor)
  })

  it('shows warning and does not call onAssignCalendar when doctor already has calendar', () => {
    render(<DoctorCard {...defaultProps} calendars={mockCalendars} />)

    const assignButton = screen.getByText('Calendar Assigned')
    fireEvent.click(assignButton)

    expect(mockShowWarning).toHaveBeenCalledWith('Only 1 calendar is allowed per doctor for now.')
    expect(defaultProps.onAssignCalendar).not.toHaveBeenCalled()
  })

  it('displays created date correctly', () => {
    render(<DoctorCard {...defaultProps} />)

    expect(screen.getByText(/Added/)).toBeInTheDocument()
  })

  it('handles missing doctor data gracefully', () => {
    const doctorWithMissingData = {
      ...mockDoctor,
      doctor_data: {
        ...mockDoctor.doctor_data,
        specializations: [],
        facilities: []
      }
    }

    render(<DoctorCard {...defaultProps} doctor={doctorWithMissingData} />)

    expect(screen.getByText('General')).toBeInTheDocument() // Default specialization
    expect(screen.getByText('No facility')).toBeInTheDocument() // Default facility
  })

  it('prevents event propagation on button clicks', () => {
    render(<DoctorCard {...defaultProps} />)

    const editButton = screen.getByText('Edit')
    const deleteButton = screen.getByText('Delete')
    const assignButton = screen.getByText('Assign Calendar')

    // Click buttons and verify onViewDetails is not called (due to stopPropagation)
    fireEvent.click(editButton)
    fireEvent.click(deleteButton)
    fireEvent.click(assignButton)

    // onViewDetails should not be called from button clicks
    expect(defaultProps.onViewDetails).not.toHaveBeenCalled()
  })
})
