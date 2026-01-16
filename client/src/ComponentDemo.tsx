import React, { useState } from 'react';
import {
  Button,
  Input,
  Select,
  Checkbox,
  Alert,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ConfirmDialog,
  Tooltip,
  useToast,
  Heading,
  Text,
} from './components/ui';

/**
 * Example usage of all feedback and overlay components
 * This demonstrates the Toast, Modal, ConfirmDialog, Alert, and Tooltip components
 */
export const ComponentDemo: React.FC = () => {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToastDemo = (type: 'success' | 'error' | 'warning' | 'info') => {
    const messages = {
      success: 'Operation completed successfully!',
      error: 'An error occurred. Please try again.',
      warning: 'This action requires your attention.',
      info: 'Here is some useful information.',
    };
    showToast(type, messages[type]);
  };

  const handleConfirm = () => {
    setIsLoading(true);
    // Simulate async operation
    setTimeout(() => {
      setIsLoading(false);
      setIsConfirmOpen(false);
      showToast('success', 'Action confirmed successfully!');
    }, 2000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <Heading level={1}>Component Demo</Heading>
      <Text>Examples of feedback and overlay components for the medical dashboard.</Text>

      {/* Toast Demo */}
      <section className="space-y-4">
        <Heading level={2}>Toast Notifications</Heading>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => handleToastDemo('success')}>
            Show Success Toast
          </Button>
          <Button variant="danger" onClick={() => handleToastDemo('error')}>
            Show Error Toast
          </Button>
          <Button variant="secondary" onClick={() => handleToastDemo('warning')}>
            Show Warning Toast
          </Button>
          <Button variant="outline" onClick={() => handleToastDemo('info')}>
            Show Info Toast
          </Button>
        </div>
      </section>

      {/* Alert Demo */}
      <section className="space-y-4">
        <Heading level={2}>Inline Alerts</Heading>
        <Alert type="info">
          <strong>Info:</strong> This is an informational message.
        </Alert>
        <Alert type="success">
          <strong>Success:</strong> Your changes have been saved.
        </Alert>
        <Alert type="warning">
          <strong>Warning:</strong> Please review your input carefully.
        </Alert>
        <Alert type="error">
          <strong>Error:</strong> Unable to process your request.
        </Alert>
      </section>

      {/* Modal Demo */}
      <section className="space-y-4">
        <Heading level={2}>Modal Dialog</Heading>
        <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="md">
          <ModalHeader onClose={() => setIsModalOpen(false)}>Patient Information</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input label="Patient Name" placeholder="Enter patient name" />
              <Input label="Patient ID" placeholder="Enter patient ID" />
              <Select
                label="Department"
                options={[
                  { value: 'cardiology', label: 'Cardiology' },
                  { value: 'neurology', label: 'Neurology' },
                  { value: 'pediatrics', label: 'Pediatrics' },
                ]}
                placeholder="Select department"
              />
              <Checkbox label="Mark as urgent" />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>
              Save
            </Button>
          </ModalFooter>
        </Modal>
      </section>

      {/* ConfirmDialog Demo */}
      <section className="space-y-4">
        <Heading level={2}>Confirm Dialog</Heading>
        <Button variant="danger" onClick={() => setIsConfirmOpen(true)}>
          Delete Patient Record
        </Button>
        <ConfirmDialog
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleConfirm}
          title="Delete Patient Record"
          description="Are you sure you want to delete this patient record? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          loading={isLoading}
        />
      </section>

      {/* Tooltip Demo */}
      <section className="space-y-4">
        <Heading level={2}>Tooltips</Heading>
        <div className="flex flex-wrap gap-4">
          <Tooltip content="Tooltip on top" placement="top">
            <Button variant="outline">Top</Button>
          </Tooltip>
          <Tooltip content="Tooltip on bottom" placement="bottom">
            <Button variant="outline">Bottom</Button>
          </Tooltip>
          <Tooltip content="Tooltip on left" placement="left">
            <Button variant="outline">Left</Button>
          </Tooltip>
          <Tooltip content="Tooltip on right" placement="right">
            <Button variant="outline">Right</Button>
          </Tooltip>
        </div>
      </section>
    </div>
  );
};
