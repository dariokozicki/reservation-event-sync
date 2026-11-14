import { useTranslations } from 'next-intl';
import { Button, IconButton } from './ui/button';
import { Field, Input } from './ui/field';
import { cn } from '../lib/cn';
import { Check, Pencil, X } from 'lucide-react';
import { useState } from 'react';
import type { InspectorProps } from '../types/ui';

export function ReservationControls({ data, pending, onAction }: InspectorProps) {
  const t = useTranslations('ReservationControls');

  const [mode, setMode] = useState<'update' | 'cancel' | null>(null);
  const source = data.source;
  if (!source || source.status === 'cancelled') return null;
  return (
    <div>
      <div className="flex items-center gap-2 pt-3">
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => setMode(mode === 'update' ? null : 'update')}
        >
          <Pencil size={14} /> {t('update')}
        </Button>
        {source.status === 'pending' && (
          <Button
            variant="primary"
            disabled={pending}
            onClick={() =>
              onAction({ action: 'append', change: { type: 'confirmed', payload: {} } })
            }
          >
            <Check size={15} /> {t('confirm')}
          </Button>
        )}
        <IconButton
          disabled={pending}
          label={t('cancelReservation')}
          onClick={() => setMode(mode === 'cancel' ? null : 'cancel')}
        >
          <X size={17} />
        </IconButton>
      </div>
      {mode === 'update' && (
        <form
          className={cn(
            'mt-[18px] grid min-w-0 gap-3 min-[520px]:min-w-[290px]',
            'max-[900px]:max-w-[440px]',
          )}
          onSubmit={(event) => {
            event.preventDefault();
            const fields = new FormData(event.currentTarget);
            onAction({
              action: 'append',
              change: {
                type: 'updated',
                payload: {
                  guestEmail: String(fields.get('email')),
                  guests: Number(fields.get('guests')),
                  checkIn: String(fields.get('checkIn')),
                  checkOut: String(fields.get('checkOut')),
                },
              },
            });
          }}
        >
          <Field>
            {t('guestEmail')}
            <Input name="email" type="email" defaultValue={source.guestEmail} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              {t('checkIn')}
              <Input name="checkIn" type="date" defaultValue={source.checkIn} required />
            </Field>
            <Field>
              {t('checkOut')}
              <Input name="checkOut" type="date" defaultValue={source.checkOut} required />
            </Field>
          </div>
          <Field>
            {t('guests')}
            <Input
              name="guests"
              type="number"
              min={1}
              max={12}
              defaultValue={source.guests}
              required
            />
          </Field>
          <Button type="submit" variant="primary" disabled={pending}>
            {t('sendUpdate')}
          </Button>
        </form>
      )}
      {mode === 'cancel' && (
        <form
          className={cn(
            'mt-[18px] grid min-w-0 gap-3 min-[520px]:min-w-[290px]',
            'max-[900px]:max-w-[440px]',
          )}
          onSubmit={(event) => {
            event.preventDefault();
            const reason = String(new FormData(event.currentTarget).get('reason'));
            onAction({ action: 'append', change: { type: 'cancelled', payload: { reason } } });
          }}
        >
          <Field>
            {t('cancellationReason')}
            <Input name="reason" defaultValue={t('defaultReason')} maxLength={300} required />
          </Field>
          <Button type="submit" variant="danger" disabled={pending}>
            {t('sendCancellation')}
          </Button>
        </form>
      )}
    </div>
  );
}
