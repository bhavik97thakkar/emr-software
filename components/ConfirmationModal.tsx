
import React from 'react';
import { AlertCircle, X, ShieldAlert } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'info' | 'warning';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  type = 'info'
}) => {
  if (!isOpen) return null;

  const themes = {
    danger: {
      bg: 'bg-rose-50',
      iconBg: 'bg-rose-100',
      icon: <ShieldAlert className="text-rose-600" size={24} />,
      button: 'bg-rose-600 hover:bg-rose-700 shadow-rose-200',
      border: 'border-rose-100',
      text: 'text-rose-900'
    },
    warning: {
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-100',
      icon: <AlertCircle className="text-amber-600" size={24} />,
      button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200',
      border: 'border-amber-100',
      text: 'text-amber-900'
    },
    info: {
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      icon: <AlertCircle className="text-blue-600" size={24} />,
      button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200',
      border: 'border-blue-100',
      text: 'text-blue-900'
    }
  };

  const theme = themes[type];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#050912]/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl shadow-black/20 overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
        <div className={`p-8 ${theme.bg} border-b ${theme.border} flex items-center justify-between`}>
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 ${theme.iconBg} rounded-2xl flex items-center justify-center`}>
              {theme.icon}
            </div>
            <h3 className={`text-lg font-black tracking-tight font-serif-clinical ${theme.text}`}>
              {title}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-black/5 rounded-xl text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-10">
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest leading-relaxed">
            {message}
          </p>
          
          <div className="mt-10 flex flex-col space-y-3">
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`w-full py-4 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 ${theme.button}`}
            >
              {confirmLabel}
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
