'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

interface DeleteSleepLogProps {
  logId: string;
  date: string;
  isNap: boolean;
}

export function DeleteSleepLog({ logId, date, isNap }: DeleteSleepLogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('sleep_logs')
        .delete()
        .eq('id', logId);

      if (error) {
        console.error('Delete error:', error);
        alert('Failed to delete. Please try again.');
        return;
      }

      setIsOpen(false);
      router.refresh();
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('An error occurred. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Delete button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
        title="Delete entry"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Confirmation modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-card rounded-2xl border border-border w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Warning header */}
            <div className="bg-danger/10 px-6 py-6 text-center">
              <div className="w-12 h-12 bg-danger/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 text-danger" />
              </div>
              <h2 className="text-lg font-bold text-text-primary">Delete {isNap ? 'Nap' : 'Sleep Log'}?</h2>
              <p className="text-text-secondary text-sm mt-1">{date}</p>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-text-secondary text-sm text-center mb-6">
                This will permanently delete this {isNap ? 'nap' : 'sleep'} entry. This action cannot be undone.
              </p>

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  onClick={handleDelete}
                  isLoading={isDeleting}
                  className="w-full bg-danger hover:bg-danger/90 text-white"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Entry
                </Button>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  className="w-full"
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
