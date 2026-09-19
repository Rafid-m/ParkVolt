import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Zap, Camera, MapPin, Ruler, Tag, Calendar, Shield, Car } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const STEPS = ['Address', 'Parking Type', 'Dimensions', 'Photos', 'EV Charger', 'Availability', 'Pricing', 'Rules', 'Publish'];
const STEP_ICONS = [MapPin, Car, Ruler, Camera, Zap, Calendar, Tag, Shield, Check];

const PARKING_TYPES = ['driveway', 'garage', 'lot', 'covered', 'commercial', 'other'];

export default function HostOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', address: '', neighborhood: '', zip: '', lat: 40.7589, lng: -73.9851,
    parking_type: 'driveway', covered: false, max_vehicle_size: 'sedan',
    length_mm: 5000, width_mm: 2200, height_clearance_mm: 2100, entrance_width_mm: 2400,
    photos: [], access_24_7: true, overnight_allowed: true,
    has_ev_charging: false, charger_level: 'level_2', connector: 'nacs', max_kw: 11, charging_price_kwh: 0.4, num_chargers: 1,
    hourly_price: 7, daily_price: 45, weekly_price: 250, monthly_price: 800, overnight_price: 25,
    host_instructions: '', security_camera: false, gated: false, instant_booking: true,
    status: 'active',
  });

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const geocode = async () => {
    if (!form.address) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.address + ', New York, NY')}&limit=1`);
      const data = await res.json();
      if (data?.[0]) { update('lat', parseFloat(data[0].lat)); update('lng', parseFloat(data[0].lon)); }
    } catch (e) { console.error(e); }
  };

  const publish = async () => {
    setSaving(true);
    try {
      await base44.entities.ParkingSpace.create({
        ...form,
        host_name: user?.full_name || 'Host',
        verified: false,
      });
      toast({ title: 'Listing published!' });
      navigate('/host/dashboard');
    } catch (e) {
      toast({ title: 'Failed to publish', description: e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const next = () => step < STEPS.length - 1 ? setStep(step + 1) : publish();
  const back = () => step > 0 ? setStep(step - 1) : navigate('/');

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 glass-strong flex items-center gap-3 border-b border-border px-4 py-3">
        <button onClick={back} className="text-muted-foreground"><ArrowLeft size={20} /></button>
        <h1 className="font-display text-base font-bold">List Your Parking Space</h1>
      </header>

      {/* Progress */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
          <span className="text-xs font-medium text-primary">{STEPS[step]}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>

      <div className="mx-auto max-w-lg p-4">
        {step === 0 && (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-bold">Property Address</h2>
            <Input label="Listing title" value={form.title} onChange={(v) => update('title', v)} placeholder="Private Driveway near Central Park" />
            <Input label="Street address" value={form.address} onChange={(v) => update('address', v)} onBlur={geocode} placeholder="123 W 45th St, New York, NY" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Neighborhood" value={form.neighborhood} onChange={(v) => update('neighborhood', v)} placeholder="Midtown" />
              <Input label="ZIP" value={form.zip} onChange={(v) => update('zip', v)} placeholder="10036" />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-bold">Parking Type</h2>
            <div className="grid grid-cols-2 gap-2">
              {PARKING_TYPES.map((t) => (
                <button key={t} onClick={() => update('parking_type', t)} className={cn('rounded-xl border px-3 py-3 text-sm capitalize', form.parking_type === t ? 'border-primary bg-primary/5' : 'border-border')}>
                  {t}
                </button>
              ))}
            </div>
            <Toggle label="Covered parking" value={form.covered} onChange={(v) => update('covered', v)} />
            <SelectInput label="Max vehicle size" value={form.max_vehicle_size} onChange={(v) => update('max_vehicle_size', v)} options={['compact', 'sedan', 'suv', 'truck', 'any']} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-bold">Parking Dimensions</h2>
            <p className="text-sm text-muted-foreground">Used to check vehicle fit. Enter in mm.</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Length (mm)" value={form.length_mm} onChange={(v) => update('length_mm', Number(v))} type="number" />
              <Input label="Width (mm)" value={form.width_mm} onChange={(v) => update('width_mm', Number(v))} type="number" />
              <Input label="Height clearance (mm)" value={form.height_clearance_mm} onChange={(v) => update('height_clearance_mm', Number(v))} type="number" />
              <Input label="Entrance width (mm)" value={form.entrance_width_mm} onChange={(v) => update('entrance_width_mm', Number(v))} type="number" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-bold">Photos</h2>
            <p className="text-sm text-muted-foreground">Add photos of the parking space, entrance, and street view.</p>
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <PhotoUpload key={i} index={i} photos={form.photos} onChange={(photos) => update('photos', photos)} />
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-bold">EV Charger</h2>
            <p className="text-sm">Does this space have EV charging?</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => update('has_ev_charging', true)} className={cn('rounded-xl border py-3 text-sm font-medium', form.has_ev_charging ? 'border-secondary bg-secondary/10 text-secondary' : 'border-border')}>Yes</button>
              <button onClick={() => update('has_ev_charging', false)} className={cn('rounded-xl border py-3 text-sm font-medium', !form.has_ev_charging ? 'border-border bg-muted' : 'border-border')}>No</button>
            </div>
            {form.has_ev_charging && (
              <div className="space-y-3 rounded-xl border border-secondary/30 bg-secondary/5 p-3">
                <SelectInput label="Charger level" value={form.charger_level} onChange={(v) => update('charger_level', v)} options={['level_1', 'level_2', 'dc_fast']} />
                <SelectInput label="Connector" value={form.connector} onChange={(v) => update('connector', v)} options={['nacs', 'ccs', 'chademo', 'j1772', 'tesla']} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Max kW" value={form.max_kw} onChange={(v) => update('max_kw', Number(v))} type="number" />
                  <Input label="Price $/kWh" value={form.charging_price_kwh} onChange={(v) => update('charging_price_kwh', Number(v))} type="number" />
                </div>
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-bold">Availability</h2>
            <Toggle label="Available 24/7" value={form.access_24_7} onChange={(v) => update('access_24_7', v)} />
            <Toggle label="Overnight allowed" value={form.overnight_allowed} onChange={(v) => update('overnight_allowed', v)} />
            <Toggle label="Instant booking" value={form.instant_booking} onChange={(v) => update('instant_booking', v)} />
          </div>
        )}

        {step === 6 && (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-bold">Pricing</h2>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Hourly ($)" value={form.hourly_price} onChange={(v) => update('hourly_price', Number(v))} type="number" />
              <Input label="Daily ($)" value={form.daily_price} onChange={(v) => update('daily_price', Number(v))} type="number" />
              <Input label="Weekly ($)" value={form.weekly_price} onChange={(v) => update('weekly_price', Number(v))} type="number" />
              <Input label="Monthly ($)" value={form.monthly_price} onChange={(v) => update('monthly_price', Number(v))} type="number" />
              <Input label="Overnight ($)" value={form.overnight_price} onChange={(v) => update('overnight_price', Number(v))} type="number" />
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-bold">Rules & Access</h2>
            <Toggle label="Security camera" value={form.security_camera} onChange={(v) => update('security_camera', v)} />
            <Toggle label="Gated" value={form.gated} onChange={(v) => update('gated', v)} />
            <div>
              <label className="text-xs text-muted-foreground">Access instructions for drivers</label>
              <textarea value={form.host_instructions} onChange={(e) => update('host_instructions', e.target.value)} rows={4} placeholder="e.g. Enter through the side gate. Park on the left side." className="mt-1 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none" />
            </div>
          </div>
        )}

        {step === 8 && (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-bold">Review & Publish</h2>
            <div className="space-y-2 rounded-xl border border-border bg-card p-4 text-sm">
              <Row label="Title" value={form.title || 'Untitled'} />
              <Row label="Type" value={form.parking_type} />
              <Row label="Address" value={form.address} />
              <Row label="Hourly" value={`$${form.hourly_price}`} />
              <Row label="EV Charging" value={form.has_ev_charging ? 'Yes' : 'No'} />
              <Row label="24/7 Access" value={form.access_24_7 ? 'Yes' : 'No'} />
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <div className="mx-auto flex max-w-lg gap-2">
          {step > 0 && <button onClick={back} className="rounded-xl border border-border px-5 py-3 text-sm font-medium">Back</button>}
          <button onClick={next} disabled={saving} className="flex-1 rounded-xl bg-primary py-3 font-display text-sm font-bold text-primary-foreground disabled:opacity-50">
            {saving ? 'Publishing…' : step === STEPS.length - 1 ? 'Publish Listing' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none" />
    </div>
  );
}
function SelectInput({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm capitalize focus:outline-none">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function Toggle({ label, value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-3 py-3 text-sm">
      {label}
      <span className={cn('relative h-6 w-11 rounded-full transition-colors', value ? 'bg-primary' : 'bg-muted')}>
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform', value ? 'translate-x-5' : 'translate-x-0.5')} />
      </span>
    </button>
  );
}
function Row({ label, value }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-medium capitalize">{value}</span></div>;
}
function PhotoUpload({ index, photos, onChange }) {
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      const next = [...photos];
      next[index] = file_url;
      onChange(next);
    } catch (e) { console.error(e); }
  };
  return (
    <label className="flex h-28 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-card">
      {photos[index] ? (
        <img src={photos[index]} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex flex-col items-center text-muted-foreground"><Camera size={20} /><span className="mt-1 text-[10px]">Photo {index + 1}</span></div>
      )}
      <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </label>
  );
} 
