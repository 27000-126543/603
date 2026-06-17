import { Dialog, Transition } from '@headlessui/react';
import { Fragment, ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'warning' | 'success';
  icon?: ReactNode;
  isLoading?: boolean;
  children?: ReactNode;
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  variant = 'danger',
  icon,
  isLoading = false,
  children,
}: ConfirmModalProps) => {
  const variantClasses = {
    danger: 'bg-danger-600 hover:bg-danger-700',
    primary: 'bg-primary-600 hover:bg-primary-700',
    warning: 'bg-warning-600 hover:bg-warning-700',
    success: 'bg-success-600 hover:bg-success-700',
  };

  const iconComponent = icon || <AlertTriangle size={24} className="text-danger-500" />;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 p-6 text-left align-middle shadow-xl transition-all">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 btn-ghost p-1"
                >
                  <X size={18} />
                </button>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center flex-shrink-0">
                    {iconComponent}
                  </div>
                  <div className="flex-1">
                    <Dialog.Title as="h3" className="text-lg font-semibold text-neutral-900 dark:text-white">
                      {title}
                    </Dialog.Title>
                    {message && (
                      <Dialog.Description className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        {message}
                      </Dialog.Description>
                    )}
                  </div>
                </div>

                {children && (
                  <div className="mt-4">
                    {children}
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    {cancelText}
                  </button>
                  <button
                    type="button"
                    className={`btn text-white ${variantClasses[variant]}`}
                    onClick={onConfirm}
                    disabled={isLoading}
                  >
                    {confirmText}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
