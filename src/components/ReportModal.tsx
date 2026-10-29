import React, { useState } from 'react';
import { api } from '../services/api.ts';
import { X, ShieldAlert, Check } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportTarget: {
    reportedUser?: string | null;
    reportedPost?: string | null;
    reportedTrip?: string | null;
  } | null;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  reportTarget,
}) => {
  const [reason, setReason] = useState('Spam or Commercial Promotion');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !reportTarget) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.submitReport({
        reportedUser: reportTarget.reportedUser,
        reportedPost: reportTarget.reportedPost,
        reportedTrip: reportTarget.reportedTrip,
        reason,
        description,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDescription('');
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-[#E5E3D8] animate-in fade-in duration-150">
        
        {/* Header */}
        <div className="p-4 bg-[#F8F7F2] border-b border-[#E5E3D8] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#174D3C] uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-[#C99E4E]" />
            <span>Report Content to Moderation</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8A9790] hover:text-[#202824] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-2">
            <Check className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="font-semibold text-sm text-[#174D3C]">Report Received</h4>
            <p className="text-xs text-[#5E6963]">
              Thank you for keeping our travel community safe and respectful. Our moderation team has been notified.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
            {error && (
              <div className="p-2.5 bg-red-50 text-red-700 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold text-[#174D3C] block mb-1">
                Reason for Report *
              </label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg text-xs"
              >
                <option value="Spam or Commercial Promotion">Spam or Commercial Promotion</option>
                <option value="Inappropriate or Offensive Media">Inappropriate or Offensive Media</option>
                <option value="Harassment or Unwanted Contact">Harassment or Unwanted Contact</option>
                <option value="Fraudulent or Misleading Trip">Fraudulent or Misleading Trip</option>
                <option value="Community Guidelines Violation">Other Safety Concern</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#174D3C] block mb-1">
                Description & Context
              </label>
              <textarea
                rows={3}
                placeholder="Provide any relevant details to assist the moderation team..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#F8F7F2] hover:bg-[#EFECE3] rounded-lg text-[#5E6963] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
