import { Toaster } from 'react-hot-toast';

export const ToastConfig = () => {
  return (
    <Toaster 
      position="top-right"
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          color: '#374151',
          border: '1px solid #E5E7EB',
          borderRadius: '0.75rem',
          fontSize: '14px',
          fontWeight: '500',
          padding: '16px',
        },
        success: {
          style: {
            background: '#10B981',
            color: 'white',
            border: '1px solid #059669',
          },
          iconTheme: {
            primary: 'white',
            secondary: '#10B981',
          },
        },
        error: {
          style: {
            background: '#EF4444',
            color: 'white',
            border: '1px solid #DC2626',
          },
          duration: 6000,
          iconTheme: {
            primary: 'white',
            secondary: '#EF4444',
          },
        },
        loading: {
          style: {
            background: '#3B82F6',
            color: 'white',
            border: '1px solid #2563EB',
          },
        },
      }}
    />
  );
};