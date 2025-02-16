'use client';

import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cn } from '@/lib/utils';

const ToastContext = React.createContext<any>(null);

export function useToast() {
  return React.useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [variant, setVariant] = React.useState<'default' | 'destructive'>('default');

  const showToast = ({ title, description, variant = 'default' }: { title: string; description: string; variant?: 'default' | 'destructive' }) => {
    setMessage(description);
    setVariant(variant);
    setOpen(true);
  };

  return (
    <ToastContext.Provider value={{ toast: showToast }}>
      {children}
      <ToastPrimitive.Root open={open} onOpenChange={setOpen} className={cn('fixed bottom-5 right-5 p-4 bg-gray-900 text-white rounded-md shadow-lg')}>
        <ToastPrimitive.Title className="font-bold">{variant === 'destructive' ? 'Error' : 'Success'}</ToastPrimitive.Title>
        <ToastPrimitive.Description>{message}</ToastPrimitive.Description>
      </ToastPrimitive.Root>
      <ToastPrimitive.Viewport className="fixed bottom-0 right-0 p-6 flex flex-col gap-2" />
    </ToastContext.Provider>
  );
}
