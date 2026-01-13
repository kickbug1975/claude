import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from '../../components/Modal'

describe('Modal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Modal',
    children: <p>Modal content</p>,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      render(<Modal {...defaultProps} />)

      expect(screen.getByText('Test Modal')).toBeInTheDocument()
      expect(screen.getByText('Modal content')).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(<Modal {...defaultProps} isOpen={false} />)

      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument()
    })

    it('should render title in header', () => {
      render(<Modal {...defaultProps} title="Custom Title" />)

      expect(screen.getByText('Custom Title')).toBeInTheDocument()
    })

    it('should render children content', () => {
      render(
        <Modal {...defaultProps}>
          <div data-testid="custom-content">Custom children</div>
        </Modal>
      )

      expect(screen.getByTestId('custom-content')).toBeInTheDocument()
      expect(screen.getByText('Custom children')).toBeInTheDocument()
    })
  })

  describe('Size variants', () => {
    it('should apply default md size class', () => {
      const { container } = render(<Modal {...defaultProps} />)

      const modalContent = container.querySelector('.max-w-lg')
      expect(modalContent).toBeInTheDocument()
    })

    it('should apply sm size class', () => {
      const { container } = render(<Modal {...defaultProps} size="sm" />)

      const modalContent = container.querySelector('.max-w-md')
      expect(modalContent).toBeInTheDocument()
    })

    it('should apply lg size class', () => {
      const { container } = render(<Modal {...defaultProps} size="lg" />)

      const modalContent = container.querySelector('.max-w-2xl')
      expect(modalContent).toBeInTheDocument()
    })

    it('should apply xl size class', () => {
      const { container } = render(<Modal {...defaultProps} size="xl" />)

      const modalContent = container.querySelector('.max-w-4xl')
      expect(modalContent).toBeInTheDocument()
    })
  })

  describe('Closing behavior', () => {
    it('should call onClose when close button is clicked', () => {
      render(<Modal {...defaultProps} />)

      const closeButton = screen.getByRole('button')
      fireEvent.click(closeButton)

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when overlay is clicked', () => {
      const { container } = render(<Modal {...defaultProps} />)

      const overlay = container.querySelector('.bg-black\\/50')
      fireEvent.click(overlay!)

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when Escape key is pressed', () => {
      render(<Modal {...defaultProps} />)

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should not call onClose for other keys', () => {
      render(<Modal {...defaultProps} />)

      fireEvent.keyDown(document, { key: 'Enter' })
      fireEvent.keyDown(document, { key: 'Tab' })

      expect(defaultProps.onClose).not.toHaveBeenCalled()
    })
  })

  describe('Body scroll lock', () => {
    it('should set body overflow to hidden when opened', () => {
      render(<Modal {...defaultProps} />)

      expect(document.body.style.overflow).toBe('hidden')
    })

    it('should reset body overflow when closed', () => {
      const { rerender } = render(<Modal {...defaultProps} />)

      rerender(<Modal {...defaultProps} isOpen={false} />)

      expect(document.body.style.overflow).toBe('unset')
    })

    it('should reset body overflow on unmount', () => {
      const { unmount } = render(<Modal {...defaultProps} />)

      unmount()

      expect(document.body.style.overflow).toBe('unset')
    })
  })

  describe('Accessibility', () => {
    it('should have a close button', () => {
      render(<Modal {...defaultProps} />)

      const closeButton = screen.getByRole('button')
      expect(closeButton).toBeInTheDocument()
    })

    it('should render modal with proper structure', () => {
      const { container } = render(<Modal {...defaultProps} />)

      // Check for main modal container
      expect(container.querySelector('.fixed.inset-0')).toBeInTheDocument()

      // Check for modal content area
      expect(container.querySelector('.bg-white.rounded-lg')).toBeInTheDocument()
    })
  })

  describe('Event cleanup', () => {
    it('should remove event listeners when modal is closed', () => {
      const { rerender } = render(<Modal {...defaultProps} />)

      // Close the modal
      rerender(<Modal {...defaultProps} isOpen={false} />)

      // Reset mock
      defaultProps.onClose.mockClear()

      // Press Escape - should not trigger onClose since modal is closed
      fireEvent.keyDown(document, { key: 'Escape' })

      expect(defaultProps.onClose).not.toHaveBeenCalled()
    })
  })
})
