import { useTranslations } from 'next-intl';
import { Button } from './ui/button';
import { Field, Select, Input } from './ui/field';
import { cn } from '../lib/cn';
import { Play, Plus, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import type { ReservationDetails } from '../types/domain';
import type { DemoScenario, SimulatorProps } from '../types/ui';
import { isDemoScenario, scenarioIds } from './scenario-options';

export function Simulator({ pending, onRun }: SimulatorProps) {
  const t = useTranslations('Simulator');
  const scenarios = useTranslations('Scenarios');

  const [mode, setMode] = useState<'scenario' | 'custom'>('scenario');
  const [scenario, setScenario] = useState<DemoScenario>('reordered');
  return (
    <section className="rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between px-[26px] pt-6 pb-5 max-[520px]:px-[18px]">
        <div>
          <p className="mb-2 text-[10px] tracking-[2px] text-muted">{t('eyebrow')}</p>
          <h2 className="font-display text-[25px] font-normal tracking-[-0.4px]">{t('title')}</h2>
        </div>
        <span className="size-1.5 rounded-full bg-sage" />
      </div>
      <div
        className={cn(
          'mx-[26px] flex rounded-md bg-stone-200 p-[3px] max-[520px]:mx-[18px]',
          '[&_button]:flex-1 [&_button]:rounded [&_button]:px-1.5 [&_button]:py-2',
          '[&_button]:text-xs [&_button[aria-pressed=true]]:bg-surface',
          '[&_button[aria-pressed=true]]:shadow-sm',
        )}
        aria-label={t('simulationMode')}
      >
        <button
          className={cn(
            'cursor-pointer transition-colors disabled:cursor-wait disabled:opacity-50',
            'focus-visible:outline-2 focus-visible:outline-offset-4',
            'focus-visible:outline-gold',
          )}
          aria-pressed={mode === 'scenario'}
          onClick={() => setMode('scenario')}
        >
          {t('scenarios')}
        </button>
        <button
          className={cn(
            'cursor-pointer transition-colors disabled:cursor-wait disabled:opacity-50',
            'focus-visible:outline-2 focus-visible:outline-offset-4',
            'focus-visible:outline-gold',
          )}
          aria-pressed={mode === 'custom'}
          onClick={() => setMode('custom')}
        >
          {t('createReservation')}
        </button>
      </div>
      {mode === 'scenario' ? (
        <div className="px-[26px] pt-5 pb-6 max-[520px]:px-[18px] [&_select]:mt-[7px]">
          <Field htmlFor="scenario">{t('scenario')}</Field>
          <Select
            id="scenario"
            value={scenario}
            onChange={(event) => {
              if (isDemoScenario(event.target.value)) setScenario(event.target.value);
            }}
          >
            {scenarioIds.map((id) => (
              <option key={id} value={id}>
                {scenarios(`${id}.name`)}
              </option>
            ))}
          </Select>
          <p className="min-h-[62px] pt-3 text-[13px] leading-relaxed text-muted">
            {scenarios(`${scenario}.description`)}
          </p>
          <div
            className={cn(
              'flex flex-col gap-[7px] pt-[15px] pb-5 [&_span]:text-[9px]',
              '[&_code]:text-sm [&_span]:tracking-[1.5px] [&_span]:text-muted',
              '[&_code]:text-gold',
            )}
          >
            <span>{t('deliveryOrder')}</span>
            <code>{scenarios(`${scenario}.order`)}</code>
          </div>
          <Button
            variant="primary"
            className="w-full"
            disabled={pending}
            onClick={() => onRun({ scenario })}
          >
            <Play size={15} /> {pending ? t('sendingEvents') : t('runScenario')}{' '}
            <ArrowRight size={16} />
          </Button>
          <p className="mt-3 text-center text-xs text-muted">{t('runNote')}</p>
        </div>
      ) : (
        <CreateForm pending={pending} onRun={onRun} />
      )}
    </section>
  );
}

function CreateForm({ pending, onRun }: SimulatorProps) {
  const t = useTranslations('Simulator');

  function submit(form: HTMLFormElement) {
    const data = new FormData(form);
    const details: ReservationDetails = {
      guestName: String(data.get('guestName')),
      guestEmail: String(data.get('guestEmail')),
      property: String(data.get('property')),
      checkIn: String(data.get('checkIn')),
      checkOut: String(data.get('checkOut')),
      guests: Number(data.get('guests')),
    };
    onRun({ scenario: 'manual', details });
  }
  return (
    <form
      className="grid gap-[13px] px-[26px] pt-5 pb-6 max-[520px]:px-[18px]"
      onSubmit={(event) => {
        event.preventDefault();
        submit(event.currentTarget);
      }}
    >
      <Field>
        {t('guestName')}
        <Input name="guestName" defaultValue="Alex Morgan" required maxLength={100} />
      </Field>
      <Field>
        {t('email')}
        <Input name="guestEmail" type="email" defaultValue="alex@example.com" required />
      </Field>
      <Field>
        {t('property')}
        <Select name="property" defaultValue="Parkline · The Loop">
          <option>{t('parklineTheLoop')}</option>
          <option>{t('count1000mGrantPark')}</option>
          <option>{t('avenirRiverWest')}</option>
          <option>{t('avraWestLoop')}</option>
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field>
          {t('checkIn')}
          <Input name="checkIn" type="date" defaultValue="2027-02-12" required />
        </Field>
        <Field>
          {t('checkOut')}
          <Input name="checkOut" type="date" defaultValue="2027-02-16" required />
        </Field>
      </div>
      <Field>
        {t('guests')}
        <Input name="guests" type="number" min={1} max={12} defaultValue={2} required />
      </Field>
      <Button type="submit" variant="primary" className="w-full" disabled={pending}>
        <Plus size={16} /> {pending ? t('creating') : t('createPendingReservation')}
      </Button>
    </form>
  );
}
