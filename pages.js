import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navigation, MessageSquare, AlertTriangle, Clock, Plus, MapPin, Car, Zap, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const EXTEND_OPTIONS = [
  { label: '+30 Minutes', hours: 0.5 },
  { label: '+1 Hour', hours: 1 },
  { label: '+2 Hours', hours: 2 },
];

export default function ActiveParking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [extending, setExtending] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setReservation(await base44.entities.Reservation.get(id));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [id]);

  const start = reservation ? new Date(reservation.start_time) : null;
  const end = reservation ? new Date(reservation.end_time) : null;
  const remaining = end ? Math.max(0, end - now) : 0;
  const isActive = remaining > 0 && now >= start;

  const fmt = (ms) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleExtend = async (hours) => {
    setExtending(true);
    try {
      const newEnd = new Date(end.getTime() + hours * 3600000);
      const updated = await base44.entities.Reservation.update(reservation.id, {
        end_time: newEnd.toISOString(),
        duration_hours: reservation.duration_hours + hours,
        total: reservation.total + reservation.parking_total / reservation.duration_hours * hours,
      });
      setReservation(updated);
      toast({ title: `Extended by ${hours}h` });
    } catch (e) {
      toast({ title: 'Extension failed', variant: 'destructive' });
    } finally {
      setExtending(false);
    }
  };

  const handleEnd = async () => {
    try {
      await base44.entities.Reservation.update(reservation.id, { status: 'completed', end_time: now.toISOString() });
      toast({ title: 'Parking ended' });
      navigate('/trips');
    } catch (e) {
      toast({ title: 'Failed to end parking', variant: 'destructive' });
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;
  if (!reservation) return <div className="p-8 text-center text-muted-foreground">Reservation not found</div>;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 glass-strong flex items-center gap-3 border-b border-border px-4 py-3">
        <Link to="/trips" className="text-muted-foreground hover:text-primary"><ArrowLeft size={20} /></Link>
        <h1 className="font-display text-base font-bold">Parking Active</h1>
      </header>

      <div className="mx-auto max-w-lg space-y-4 p-4">
        {/* Timer */}
        <div className="flex flex-col items-center rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
          <Clock size={20} className="text-primary" />
          <p className="mt-2 font-display text-4xl font-bold tabular-nums text-primary">{fmt(remaining)}</p>
          <p className="text-sm text-muted-foreground">{isActive ? 'remaining' : now < start ? 'starts soon' : 'ended'}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-2 text-sm">
          <div className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 text-primary" /><div><p className="font-medium">{reservation.parking_space_title}</p><p className="text-xs text-muted-foreground">{reservation.parking_space_address}</p></div></div>
          <div className="flex items-center gap-2"><Car size={16} className="text-primary" /><span>{reservation.vehicle_label}</span></div>
          {reservation.has_charging && <div className="flex items-center gap-2 text-secondary"><Zap size={16} /> Charging included</div>}
          <div className="flex justify-between border-t border-border pt-2"><span className="text-muted-foreground">Total paid</span><span className="font-semibold">${reservation.total?.toFixed(2)}</span></div>
        </div>

        {/* Extend */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-semibold">Extend Parking</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {EXTEND_OPTIONS.map((o) => (
              <button key={o.label} disabled={extending} onClick={() => handleExtend(o.hours)} className="flex flex-col items-center gap-1 rounded-xl border border-border py-2.5 text-xs font-medium hover:border-primary disabled:opacity-50">
                <Plus size={14} />
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <div className="mx-auto grid max-w-lg grid-cols-2 gap-2">
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${reservation.parking_space_lat},${reservation.parking_space_lng}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 rounded-xl border border-border py-3 text-sm font-medium">
            <Navigation size={16} /> Directions Back
          </a>
          <Link to="/messages" className="flex items-center justify-center gap-1.5 rounded-xl border border-border py-3 text-sm font-medium">
            <MessageSquare size={16} /> Message Host
          </Link>
          <Link to={`/report/${reservation.id}`} className="flex items-center justify-center gap-1.5 rounded-xl border border-border py-3 text-sm font-medium">
            <AlertTriangle size={16} /> Report Problem
          </Link>
          <button onClick={handleEnd} className="flex items-center justify-center gap-1.5 rounded-xl bg-destructive py-3 text-sm font-bold text-destructive-foreground">
            End Parking
          </button>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Users, MapPin, Calendar, DollarSign, AlertTriangle, TrendingUp, Zap, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

export default function Admin() {
  const [data, setData] = useState({ users: [], spaces: [], reservations: [], reviews: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    (async () => {
      try {
        const [users, spaces, reservations, reviews] = await Promise.all([
          base44.entities.User.list('-created_date', 100),
          base44.entities.ParkingSpace.filter({}, '-created_date', 100),
          base44.entities.Reservation.filter({}, '-start_time', 100),
          base44.entities.Review.list('-created_date', 100),
        ]);
        setData({ users, spaces, reservations, reviews });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const totalRevenue = data.reservations.reduce((s, r) => s + (r.total || 0), 0);
  const evSpaces = data.spaces.filter((s) => s.has_ev_charging);
  const pendingVerification = data.spaces.filter((s) => !s.verified);

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="sticky top-0 z-50 glass-strong border-b border-border px-4 py-4">
        <h1 className="font-display text-xl font-bold">Admin Dashboard</h1>
      </header>

      <div className="mx-auto max-w-4xl p-4">
        {/* Tabs */}
        <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto">
          {['overview', 'users', 'parking', 'bookings', 'ev', 'reports'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn('shrink-0 rounded-full px-4 py-1.5 text-sm font-medium capitalize', tab === t ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground')}>{t}</button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <AdminStat icon={Users} label="Users" value={data.users.length} />
            <AdminStat icon={MapPin} label="Listings" value={data.spaces.length} />
            <AdminStat icon={Calendar} label="Reservations" value={data.reservations.length} />
            <AdminStat icon={DollarSign} label="Revenue" value={`$${totalRevenue.toFixed(0)}`} accent />
            <AdminStat icon={Zap} label="EV Spaces" value={evSpaces.length} green />
            <AdminStat icon={ShieldCheck} label="Pending Verify" value={pendingVerification.length} />
            <AdminStat icon={TrendingUp} label="Reviews" value={data.reviews.length} />
            <AdminStat icon={AlertTriangle} label="Open Reports" value={0} />
          </div>
        )}

        {tab === 'users' && (
          <div className="space-y-2">
            {data.users.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">{(u.full_name || u.email || 'U').charAt(0)}</div>
                  <div><p className="text-sm font-medium">{u.full_name || 'Unnamed'}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                </div>
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', u.role === 'admin' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>{u.role}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'parking' && (
          <div className="space-y-2">
            {data.spaces.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                <div><p className="text-sm font-medium">{s.title}</p><p className="text-xs text-muted-foreground">{s.address}</p></div>
                <div className="flex items-center gap-2">
                  {s.has_ev_charging && <Zap size={14} className="text-secondary" />}
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', s.verified ? 'bg-secondary/15 text-secondary' : 'bg-primary/15 text-primary')}>{s.verified ? 'Verified' : 'Pending'}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'bookings' && (
          <div className="space-y-2">
            {data.reservations.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                <div><p className="text-sm font-medium">{r.parking_space_title}</p><p className="text-xs text-muted-foreground">{new Date(r.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {r.vehicle_label}</p></div>
                <div className="text-right"><p className="text-sm font-bold">${r.total?.toFixed(2)}</p><p className="text-[10px] capitalize text-muted-foreground">{r.status}</p></div>
              </div>
            ))}
            {data.reservations.length === 0 && <p className="text-center text-sm text-muted-foreground">No reservations</p>}
          </div>
        )}

        {tab === 'ev' && (
          <div className="space-y-2">
            {evSpaces.map((s) => (
              <div key={s.id} className="rounded-xl border border-secondary/30 bg-secondary/5 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{s.title}</p>
                  <span className="text-xs text-secondary">⚡ {s.charger_level} • {s.max_kw}kW</span>
                </div>
                <p className="text-xs text-muted-foreground">{s.connector?.toUpperCase()} • ${s.charging_price_kwh?.toFixed(2)}/kWh</p>
              </div>
            ))}
            {evSpaces.length === 0 && <p className="text-center text-sm text-muted-foreground">No EV spaces</p>}
          </div>
        )}

        {tab === 'reports' && (
          <div className="flex flex-col items-center py-12 text-center">
            <AlertTriangle size={40} className="text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No open reports</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminStat({ icon: Icon, label, value, accent, green }) {
  return (
    <div className={cn('rounded-2xl border bg-card p-4', accent ? 'border-primary/30' : green ? 'border-secondary/30' : 'border-border')}>
      <Icon size={18} className={cn(accent ? 'text-primary' : green ? 'text-secondary' : 'text-muted-foreground')} />
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Car, CreditCard, Check, Zap, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { calculatePricing, chargerLabel, loadUserVehicles, checkVehicleFit } from '@/lib/parking';
import VehicleFitBadge from '@/components/VehicleFitBadge';
import { Image } from '@/components/ui/image';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const PAY_METHODS = [
  { id: 'apple', label: 'Apple Pay', icon: '' },
  { id: 'google', label: 'Google Pay', icon: '' },
  { id: 'card', label: 'Credit / Debit Card', icon: '💳' },
  { id: 'credits', label: 'Platform Credits', icon: '✦' },
];

export default function Booking() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const hours = parseInt(params.get('hours') || '1');
  const navigate = useNavigate();
  const { toast } = useToast();

  const [space, setSpace] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vehicleId, setVehicleId] = useState('');
  const [payMethod, setPayMethod] = useState('apple');
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, v] = await Promise.all([
          base44.entities.ParkingSpace.get(id),
          loadUserVehicles(),
        ]);
        setSpace(s);
        setVehicles(v);
        setVehicleId((v.find((x) => x.is_default) || v[0])?.id || '');
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;
  if (!space) return <div className="p-8 text-center text-muted-foreground">Space not found</div>;

  const vehicle = vehicles.find((v) => v.id === vehicleId);
  const pricing = calculatePricing(space, hours, space.has_ev_charging);
  const fit = checkVehicleFit(vehicle, space);
  const now = new Date();
  const start = new Date(now.getTime() + 5 * 60000);
  const end = new Date(start.getTime() + hours * 3600000);

  const handleReserve = async () => {
    if (!vehicle) {
      toast({ title: 'Add a vehicle first', variant: 'destructive' });
      return;
    }
    setReserving(true);
    try {
      const reservation = await base44.entities.Reservation.create({
        parking_space_id: space.id,
        parking_space_title: space.title,
        parking_space_address: space.address,
        parking_space_lat: space.lat,
        parking_space_lng: space.lng,
        vehicle_id: vehicle.id,
        vehicle_label: `${vehicle.make} ${vehicle.model}`,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        duration_hours: hours,
        status: 'upcoming',
        has_charging: space.has_ev_charging,
        parking_total: pricing.parking,
        charging_total: pricing.charging,
        service_fee: pricing.service,
        taxes: pricing.taxes,
        total: pricing.total,
        host_instructions: space.host_instructions,
        parking_photo: space.photos?.[0],
      });
      navigate(`/confirmation/${reservation.id}`);
    } catch (e) {
      console.error(e);
      toast({ title: 'Reservation failed', description: e.message, variant: 'destructive' });
    } finally {
      setReserving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 glass-strong flex items-center gap-3 border-b border-border px-4 py-3">
        <Link to="/" className="text-muted-foreground hover:text-primary"><ArrowLeft size={20} /></Link>
        <h1 className="font-display text-base font-bold">Your Reservation</h1>
      </header>

      <div className="mx-auto max-w-lg space-y-4 p-4">
        {/* Space summary */}
        <div className="flex gap-3 rounded-2xl border border-border bg-card p-3">
          <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
            {space.photos?.[0] && <Image src={space.photos[0]} fittingType="fill" className="h-full w-full" />}
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold">{space.title}</h2>
            <p className="text-xs text-muted-foreground">{space.address}</p>
            {space.has_ev_charging && <p className="mt-0.5 text-xs text-secondary">⚡ {chargerLabel(space.charger_level)}</p>}
          </div>
        </div>

        {/* Time */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><Clock size={16} className="text-primary" /> Time</div>
          <div className="mt-2 flex justify-between text-sm">
            <div><p className="text-xs text-muted-foreground">Arrival</p><p className="font-medium">{start.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</p></div>
            <div className="text-right"><p className="text-xs text-muted-foreground">Departure</p><p className="font-medium">{end.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</p></div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{hours} hour{hours > 1 ? 's' : ''}</p>
        </div>

        {/* Vehicle */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><Car size={16} className="text-primary" /> Vehicle</div>
          {vehicles.length === 0 ? (
            <Link to="/profile" className="mt-2 block text-sm text-primary">+ Add a vehicle</Link>
          ) : (
            <>
              <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.make} {v.model} {v.year || ''}</option>)}
              </select>
              {vehicle && <div className="mt-2"><VehicleFitBadge fits={fit.fits} label={fit.label} /></div>}
            </>
          )}
        </div>

        {/* Price */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Parking ({hours}h)</span><span>${pricing.parking.toFixed(2)}</span></div>
            {space.has_ev_charging && <div className="flex justify-between"><span className="text-muted-foreground">Charging (est.)</span><span>${pricing.charging.toFixed(2)}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Service fee</span><span>${pricing.service.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Taxes</span><span>${pricing.taxes.toFixed(2)}</span></div>
            <div className="flex justify-between border-t border-border pt-2 font-display text-lg font-bold"><span>Total</span><span className="text-primary">${pricing.total.toFixed(2)}</span></div>
          </div>
        </div>

        {/* Payment */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><CreditCard size={16} className="text-primary" /> Payment</div>
          <div className="mt-2 space-y-1.5">
            {PAY_METHODS.map((m) => (
              <button key={m.id} onClick={() => setPayMethod(m.id)} className={cn('flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm', payMethod === m.id ? 'border-primary bg-primary/5' : 'border-border')}>
                <span>{m.icon} {m.label}</span>
                {payMethod === m.id && <Check size={16} className="text-primary" />}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">🔒 Secure payment. We don't store card details.</p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <div className="mx-auto max-w-lg">
          <button
            onClick={handleReserve}
            disabled={reserving || !vehicle}
            className="w-full rounded-xl bg-primary py-3.5 font-display text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {reserving ? 'Reserving…' : `Reserve & Pay $${pricing.total.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, Navigation, MessageSquare, Calendar, Car, MapPin, Zap, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';

export default function Confirmation() {
  const { id } = useParams();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setReservation(await base44.entities.Reservation.get(id));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;
  if (!reservation) return <div className="p-8 text-center text-muted-foreground">Reservation not found</div>;

  const start = new Date(reservation.start_time);
  const end = new Date(reservation.end_time);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 glass-strong flex items-center gap-3 border-b border-border px-4 py-3">
        <Link to="/" className="text-muted-foreground hover:text-primary"><ArrowLeft size={20} /></Link>
        <h1 className="font-display text-base font-bold">Confirmation</h1>
      </header>

      <div className="mx-auto max-w-lg p-4">
        {/* Success */}
        <div className="flex flex-col items-center py-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/15">
            <Check size={32} className="text-secondary" />
          </div>
          <h2 className="mt-3 font-display text-xl font-bold">Parking Reserved</h2>
          <p className="text-sm text-muted-foreground">{reservation.parking_space_title}</p>
        </div>

        {/* Details */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold">{reservation.parking_space_address}</p>
                <p className="text-xs text-muted-foreground">{reservation.parking_space_title}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-semibold"><Calendar size={16} className="text-primary" /> Reservation Time</div>
            <div className="mt-2 flex justify-between text-sm">
              <div><p className="text-xs text-muted-foreground">Start</p><p className="font-medium">{start.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p></div>
              <div className="text-right"><p className="text-xs text-muted-foreground">End</p><p className="font-medium">{end.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p></div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-semibold"><Car size={16} className="text-primary" /> Vehicle</div>
            <p className="mt-1 text-sm">{reservation.vehicle_label}</p>
          </div>

          {reservation.has_charging && (
            <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-secondary"><Zap size={16} /> EV Charging Included</div>
              <p className="mt-1 text-xs text-muted-foreground">Plug in on arrival. Charging cost: ${reservation.charging_total?.toFixed(2)}</p>
            </div>
          )}

          {reservation.host_instructions && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm font-semibold">Host Instructions</p>
              <p className="mt-1 text-sm text-muted-foreground">{reservation.host_instructions}</p>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex justify-between font-display text-lg font-bold"><span>Total Paid</span><span className="text-primary">${reservation.total?.toFixed(2)}</span></div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <div className="mx-auto grid max-w-lg grid-cols-3 gap-2">
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${reservation.parking_space_lat},${reservation.parking_space_lng}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground">
            <Navigation size={16} /> Navigate
          </a>
          <Link to="/messages" className="flex items-center justify-center gap-1.5 rounded-xl border border-border py-3 text-sm font-medium">
            <MessageSquare size={16} /> Message
          </Link>
          <Link to="/trips" className="flex items-center justify-center gap-1.5 rounded-xl border border-border py-3 text-sm font-medium">
            <Calendar size={16} /> Trips
          </Link>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
    } catch {
      // Always show success regardless
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthLayout
      icon={Mail}
      title="Reset password"
      subtitle="We'll send you a link to reset it"
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline">
          <ArrowLeft className="w-3 h-3 inline mr-1" />Back to log in
        </Link>
      }
    >
      {sent ? (
        <p className="text-sm text-foreground text-center">
          If an account exists with that email, you'll receive a password reset link shortly.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
import { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search, SlidersHorizontal, Crosshair, Plus, Minus, List, Map as MapIcon,
  Zap, Clock, Navigation, X, Car,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import {
  loadParkingSpaces, loadUserVehicles, calculatePricing,
  distanceMiles, walkTimeMinutes, formatDistance, chargerLabel, checkVehicleFit,
} from '@/lib/parking';
import { pinHTML } from '@/components/ParkingPin';
import ParkingCard from '@/components/ParkingCard';
import VehicleFitBadge from '@/components/VehicleFitBadge';
import { Image } from '@/components/ui/image';
import { Link } from 'react-router-dom';

delete L.Icon.Default.prototype._getIconUrl;

const NYC_CENTER = [40.7589, -73.9851];
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

const QUICK_TIMES = [
  { label: 'Park Now', hours: 1 },
  { label: '1 Hour', hours: 1 },
  { label: '2 Hours', hours: 2 },
  { label: '4 Hours', hours: 4 },
  { label: 'Today', hours: 8 },
  { label: 'Overnight', hours: 12 },
  { label: 'Daily', hours: 24 },
  { label: 'Weekly', hours: 168 },
  { label: 'Monthly', hours: 720 },
];

const FILTER_PILLS = [
  { key: 'ev', label: 'EV Charger', icon: Zap },
  { key: 'fits', label: 'Fits My Car', icon: Car },
  { key: 'instant', label: 'Instant', icon: Clock },
  { key: 'monthly', label: 'Monthly', icon: null },
  { key: 'cheap', label: '< $10/hr', icon: null },
];

function MapController({ center, onMoveEnd }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 14, { duration: 0.8 });
  }, [center, map]);
  return null;
}

function ClickHandler({ onClick }) {
  const map = useMap();
  useEffect(() => {
    map.on('click', onClick);
    return () => map.off('click', onClick);
  }, [map, onClick]);
  return null;
}

export default function Home() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [spaces, setSpaces] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [flyTo, setFlyTo] = useState(null);
  const [userLoc, setUserLoc] = useState(null);
  const [viewMode, setViewMode] = useState('map');
  const [activeFilters, setActiveFilters] = useState({});
  const [activeQuickTime, setActiveQuickTime] = useState('Park Now');
  const [duration, setDuration] = useState(1);
  const [showSearchArea, setShowSearchArea] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, v] = await Promise.all([loadParkingSpaces(), loadUserVehicles()]);
        setSpaces(s);
        setVehicles(v);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      );
    }
  }, []);

  const defaultVehicle = vehicles.find((v) => v.is_default) || vehicles[0];

  const filtered = useMemo(() => {
    return spaces.filter((s) => {
      if (activeFilters.ev && !s.has_ev_charging) return false;
      if (activeFilters.instant && !s.instant_booking) return false;
      if (activeFilters.monthly && !s.monthly_price) return false;
      if (activeFilters.cheap && s.hourly_price >= 10) return false;
      if (activeFilters.fits && defaultVehicle) {
        const fit = checkVehicleFit(defaultVehicle, s);
        if (!fit.fits) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!s.title?.toLowerCase().includes(q) && !s.neighborhood?.toLowerCase().includes(q) && !s.address?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [spaces, activeFilters, searchQuery, defaultVehicle]);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', New York, NY')}&limit=1`
      );
      const data = await res.json();
      if (data?.[0]) {
        setFlyTo([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const centerOnUser = () => {
    if (userLoc) setFlyTo(userLoc);
  };

  const toggleFilter = (key) => setActiveFilters((p) => ({ ...p, [key]: !p[key] }));

  const setQuickTime = (label, hours) => {
    setActiveQuickTime(label);
    setDuration(hours);
  };

  const makeIcon = (space) =>
    L.divIcon({
      className: 'parking-pin',
      html: pinHTML(space, selected?.id === space.id),
      iconSize: [60, 36],
      iconAnchor: [30, 36],
    });

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#111827]">
      {/* Map */}
      <MapContainer
        center={NYC_CENTER}
        zoom={13}
        className="absolute inset-0 z-0"
        zoomControl={false}
        attributionControl={false}
        ref={mapRef}
      >
        <TileLayer url={DARK_TILES} />
        <MapController center={flyTo} />
        <ClickHandler onClick={() => setSelected(null)} />
        {filtered.map((space) => (
          <Marker
            key={space.id}
            position={[space.lat, space.lng]}
            icon={makeIcon(space)}
            eventHandlers={{ click: () => setSelected(space) }}
          />
        ))}
        {userLoc && <CircleMarker center={userLoc} radius={8} pathOptions={{ color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3 }} />}
      </MapContainer>

      {/* Mode selector top-left */}
      <Link
        to="/host"
        className="absolute left-4 top-4 z-[500] glass flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-primary"
      >
        Switch to Host
      </Link>

      {/* Top search rail */}
      <div className={cn('absolute z-[500] left-1/2 -translate-x-1/2', isMobile ? 'top-3 left-3 right-3 translate-x-0' : 'top-6 w-[640px]')}>
        <div className="glass flex items-center gap-2 rounded-2xl border border-border p-2 shadow-2xl">
          <Search size={18} className="ml-1 text-muted-foreground" />
          <form onSubmit={handleSearch} className="flex-1">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Where do you need parking in NYC?"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </form>
          <button
            onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
            className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-primary"
          >
            {viewMode === 'map' ? <List size={14} /> : <MapIcon size={14} />}
            {viewMode === 'map' ? 'List' : 'Map'}
          </button>
        </div>
        {/* Quick time pills */}
        <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {QUICK_TIMES.map((t) => (
            <button
              key={t.label}
              onClick={() => setQuickTime(t.label, t.hours)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                activeQuickTime === t.label
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'glass border-border text-muted-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        {/* Filter pills */}
        <div className="no-scrollbar mt-1.5 flex gap-1.5 overflow-x-auto">
          {FILTER_PILLS.map((f) => {
            const Icon = f.icon;
            const active = activeFilters[f.key];
            return (
              <button
                key={f.key}
                onClick={() => toggleFilter(f.key)}
                className={cn(
                  'flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  active
                    ? 'border-secondary bg-secondary/15 text-secondary'
                    : 'glass border-border text-muted-foreground'
                )}
              >
                {Icon && <Icon size={12} />}
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map controls bottom-right */}
      <div className="absolute bottom-24 right-4 z-[500] flex flex-col gap-2 md:bottom-8">
        <button onClick={() => mapRef.current?.zoomIn()} className="glass flex h-10 w-10 items-center justify-center rounded-xl border border-border text-foreground hover:text-primary">
          <Plus size={18} />
        </button>
        <button onClick={() => mapRef.current?.zoomOut()} className="glass flex h-10 w-10 items-center justify-center rounded-xl border border-border text-foreground hover:text-primary">
          <Minus size={18} />
        </button>
        <button onClick={centerOnUser} className="glass flex h-10 w-10 items-center justify-center rounded-xl border border-border text-foreground hover:text-primary">
          <Crosshair size={18} />
        </button>
      </div>

      {/* List view overlay */}
      {viewMode === 'list' && (
        <div className="absolute inset-0 z-[600] overflow-y-auto bg-background/95 pb-24 pt-36 md:pt-44">
          <div className="mx-auto max-w-2xl space-y-2.5 px-4">
            <div className="flex items-center justify-between pb-2">
              <h2 className="font-display text-lg font-bold">{filtered.length} spaces available</h2>
              <button onClick={() => setViewMode('map')} className="text-sm text-primary">Back to map</button>
            </div>
            {filtered.map((s) => (
              <ParkingCard key={s.id} space={s} userLat={userLoc?.[0]} userLng={userLoc?.[1]} onClick={() => { setSelected(s); setViewMode('map'); }} />
            ))}
          </div>
        </div>
      )}

      {/* Detail / bottom sheet */}
      {selected && (
        <DetailSheet
          space={selected}
          duration={duration}
          vehicle={defaultVehicle}
          userLat={userLoc?.[0]}
          userLng={userLoc?.[1]}
          onClose={() => setSelected(null)}
          isMobile={isMobile}
        />
      )}

      {loading && (
        <div className="absolute inset-0 z-[700] flex items-center justify-center bg-background">
          <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

function DetailSheet({ space, duration, vehicle, userLat, userLng, onClose, isMobile }) {
  const pricing = calculatePricing(space, duration, space.has_ev_charging);
  const fit = checkVehicleFit(vehicle, space);
  const dist = userLat && userLng ? distanceMiles(userLat, userLng, space.lat, space.lng) : null;

  return (
    <div className={cn(
      'absolute z-[600]',
      isMobile
        ? 'bottom-0 left-0 right-0 rounded-t-3xl'
        : 'right-6 top-24 bottom-24 w-[400px] rounded-2xl'
    )}>
      <div className="glass-strong flex h-full max-h-[85dvh] flex-col overflow-hidden rounded-2xl border border-border shadow-2xl md:max-h-none">
        {/* Photo */}
        <div className="relative h-32 shrink-0">
          {space.photos?.[0] ? (
            <Image src={space.photos[0]} fittingType="fill" className="h-full w-full" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">No photo</div>
          )}
          <button onClick={onClose} className="absolute right-3 top-3 glass flex h-8 w-8 items-center justify-center rounded-full border border-border">
            <X size={16} />
          </button>
          {space.has_ev_charging && (
            <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs font-bold text-white">
              <Zap size={12} /> {chargerLabel(space.charger_level)}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="font-display text-lg font-bold">{space.title}</h2>
          <p className="text-sm text-muted-foreground">{space.neighborhood || space.address}</p>
          {dist != null && (
            <p className="mt-1 text-xs text-muted-foreground">{formatDistance(dist)} • {walkTimeMinutes(dist)} min walk</p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <div className="flex items-center gap-1 text-xs">
              <span className="font-display text-base font-bold text-primary">${space.hourly_price}</span>
              <span className="text-muted-foreground">/hr</span>
            </div>
            {space.rating > 0 && (
              <span className="text-xs">⭐ {space.rating.toFixed(1)} ({space.num_reviews})</span>
            )}
            {space.verified && <span className="text-xs text-secondary">✓ Verified</span>}
          </div>

          {vehicle && (
            <div className="mt-3">
              <VehicleFitBadge fits={fit.fits} label={fit.label} />
            </div>
          )}

          {space.has_ev_charging && (
            <div className="mt-3 rounded-xl border border-secondary/30 bg-secondary/5 p-3">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-secondary">
                <Zap size={14} /> EV Charging
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                <span>Charger: {chargerLabel(space.charger_level)}</span>
                <span>Power: {space.max_kw || 11} kW</span>
                <span>Connector: {space.connector?.toUpperCase()}</span>
                <span>${space.charging_price_kwh?.toFixed(2)}/kWh</span>
              </div>
            </div>
          )}

          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            <p>Type: {space.parking_type}</p>
            <p>Access: {space.access_24_7 ? '24/7' : 'Limited hours'}</p>
            {space.overnight_allowed && <p>✓ Overnight allowed</p>}
            {space.security_camera && <p>✓ Security camera</p>}
            {space.gated && <p>✓ Gated</p>}
          </div>

          {/* Price breakdown */}
          <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Parking ({duration}h)</span><span>${pricing.parking.toFixed(2)}</span></div>
            {space.has_ev_charging && (
              <div className="flex justify-between"><span className="text-muted-foreground">Charging (est.)</span><span>${pricing.charging.toFixed(2)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-muted-foreground">Service fee</span><span>${pricing.service.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Taxes</span><span>${pricing.taxes.toFixed(2)}</span></div>
            <div className="flex justify-between border-t border-border pt-2 font-display text-base font-bold">
              <span>Total</span><span className="text-primary">${pricing.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="shrink-0 border-t border-border p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
          <Link
            to={`/booking/${space.id}?hours=${duration}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-display text-sm font-bold text-primary-foreground"
          >
            Reserve & Pay
          </Link>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, List, DollarSign, TrendingUp, Star, ArrowLeft, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

export default function HostDashboard() {
  const [listings, setListings] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [l, r] = await Promise.all([
          base44.entities.ParkingSpace.filter({}, '-created_date', 100),
          base44.entities.Reservation.filter({}, '-start_time', 100),
        ]);
        setListings(l);
        setReservations(r);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const now = new Date();
  const thisMonth = reservations.filter((r) => new Date(r.start_time).getMonth() === now.getMonth());
  const completed = thisMonth.filter((r) => r.status === 'completed' || new Date(r.end_time) < now);
  const revenue = completed.reduce((s, r) => s + (r.total || 0), 0);
  const chargingRevenue = completed.filter((r) => r.has_charging).reduce((s, r) => s + (r.charging_total || 0), 0);
  const todayRes = reservations.filter((r) => new Date(r.start_time).toDateString() === now.toDateString());
  const activeListings = listings.filter((l) => l.status === 'active');

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 glass-strong border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground"><ArrowLeft size={20} /></Link>
            <h1 className="font-display text-xl font-bold">Host Dashboard</h1>
          </div>
          <Link to="/host/list" className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"><Plus size={14} /> List Space</Link>
        </div>
        <div className="mt-3 flex gap-2">
          <Link to="/host/dashboard" className="rounded-lg bg-card px-3 py-1.5 text-xs font-medium">Dashboard</Link>
          <Link to="/host/listings" className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">Listings</Link>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-4 p-4">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
        ) : (
          <>
            {/* Today */}
            <div>
              <h2 className="mb-2 font-display text-sm font-bold uppercase text-muted-foreground">Today</h2>
              <div className="grid grid-cols-3 gap-2">
                <Stat label="Reservations" value={todayRes.length} />
                <Stat label="Available" value={activeListings.length} />
                <Stat label="Occupied" value={todayRes.filter((r) => new Date(r.start_time) <= now && new Date(r.end_time) >= now).length} />
              </div>
            </div>

            {/* This Month */}
            <div>
              <h2 className="mb-2 font-display text-sm font-bold uppercase text-muted-foreground">This Month</h2>
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Revenue" value={`$${revenue.toFixed(0)}`} icon={DollarSign} accent />
                <Stat label="Charging Rev." value={`$${chargingRevenue.toFixed(0)}`} icon={Zap} green />
                <Stat label="Reservations" value={thisMonth.length} />
                <Stat label="Occupancy" value={`${activeListings.length ? Math.round((todayRes.length / activeListings.length) * 100) : 0}%`} />
              </div>
            </div>

            {/* Performance */}
            <div>
              <h2 className="mb-2 font-display text-sm font-bold uppercase text-muted-foreground">Performance</h2>
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Avg Rating" value={listings.length ? (listings.reduce((s, l) => s + (l.rating || 0), 0) / listings.length).toFixed(1) : '—'} icon={Star} />
                <Stat label="Completed" value={completed.length} icon={TrendingUp} />
              </div>
            </div>

            {/* Payout */}
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
              <h2 className="font-display text-sm font-bold uppercase text-primary">Payout</h2>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Available balance</span><span className="font-display font-bold">${(revenue * 0.85).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Pending</span><span>${(revenue * 0.15).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Next payout</span><span>Oct 1</span></div>
              </div>
            </div>

            {/* Upcoming reservations */}
            <div>
              <h2 className="mb-2 font-display text-sm font-bold uppercase text-muted-foreground">Upcoming Reservations</h2>
              <div className="space-y-2">
                {reservations.filter((r) => new Date(r.start_time) > now).slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                    <div>
                      <p className="text-sm font-medium">{r.parking_space_title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.start_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                    </div>
                    <span className="font-display text-sm font-bold">${r.total?.toFixed(2)}</span>
                  </div>
                ))}
                {reservations.filter((r) => new Date(r.start_time) > now).length === 0 && <p className="text-xs text-muted-foreground">No upcoming reservations</p>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon, accent, green }) {
  return (
    <div className={cn('rounded-2xl border bg-card p-3', accent ? 'border-primary/30' : green ? 'border-secondary/30' : 'border-border')}>
      {Icon && <Icon size={14} className={cn(accent ? 'text-primary' : green ? 'text-secondary' : 'text-muted-foreground')} />}
      <p className="mt-1 font-display text-xl font-bold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MoreVertical, Star, Zap, ArrowLeft, Pause, Play } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';

export default function HostListings() {
  const { toast } = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { setListings(await base44.entities.ParkingSpace.filter({}, '-created_date', 100)); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const togglePause = async (space) => {
    try {
      await base44.entities.ParkingSpace.update(space.id, { status: space.status === 'active' ? 'paused' : 'active' });
      toast({ title: space.status === 'active' ? 'Listing paused' : 'Listing activated' });
      load();
    } catch (e) { toast({ title: 'Failed', variant: 'destructive' }); }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 glass-strong border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/host/dashboard" className="text-muted-foreground"><ArrowLeft size={20} /></Link>
            <h1 className="font-display text-xl font-bold">My Listings</h1>
          </div>
          <Link to="/host/list" className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"><Plus size={14} /> New</Link>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-3 p-4">
        {loading && <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>}
        {listings.map((s) => (
          <div key={s.id} className="rounded-2xl border border-border bg-card p-3">
            <div className="flex gap-3">
              <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                {s.photos?.[0] ? <Image src={s.photos[0]} fittingType="fill" className="h-full w-full" /> : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No photo</div>}
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-semibold">{s.title}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${s.status === 'active' ? 'bg-secondary/15 text-secondary' : 'bg-muted text-muted-foreground'}`}>{s.status}</span>
                </div>
                <p className="text-xs text-muted-foreground">{s.address}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-display font-bold text-primary">${s.hourly_price}/hr</span>
                  {s.rating > 0 && <span>⭐ {s.rating.toFixed(1)}</span>}
                  {s.has_ev_charging && <span className="text-secondary"><Zap size={11} /></span>}
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Link to={`/booking/${s.id}?hours=1`} className="rounded-lg border border-border py-2 text-center text-xs font-medium">View</Link>
              <Link to="/host/dashboard" className="rounded-lg border border-border py-2 text-center text-xs font-medium">Calendar</Link>
              <button onClick={() => togglePause(s)} className="flex items-center justify-center gap-1 rounded-lg border border-border py-2 text-xs font-medium">
                {s.status === 'active' ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Activate</>}
              </button>
            </div>
          </div>
        ))}
        {!loading && listings.length === 0 && (
          <div className="mt-12 flex flex-col items-center text-center">
            <p className="text-sm text-muted-foreground">No listings yet</p>
            <Link to="/host/list" className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">List your first space</Link>
          </div>
        )}
      </div>
    </div>
  );
}
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
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Post-login destination (e.g. the MCP OAuth consent page sends users here
  // with returnTo so the grant flow can resume). Same-origin paths only.
  const returnTo = safeReturnTo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = returnTo;
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", returnTo);
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Welcome back"
      subtitle="Log in to your account"
      footer={
        <>
          Don't have an account?{" "}
          <Link
            to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
            className="text-primary font-medium hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continue with Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">or</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging in...
            </>
          ) : (
            "Log in"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Send, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';

const QUICK_MESSAGES = [
  'I arrived',
  "I can't find the entrance",
  'The space is occupied',
  "The charger isn't working",
  'I need assistance',
];

export default function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeConv, setActiveConv] = useState(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    (async () => {
      try { setMessages(await base44.entities.Message.list('-created_date', 100)); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const conversations = {};
  messages.forEach((m) => {
    if (!conversations[m.conversation_id]) conversations[m.conversation_id] = [];
    conversations[m.conversation_id].push(m);
  });
  const convList = Object.entries(conversations).map(([id, msgs]) => ({ id, msgs: msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)) }));
  const active = convList.find((c) => c.id === activeConv);

  const send = async (body, isQuick = false) => {
    if (!body.trim() || !activeConv) return;
    try {
      const msg = await base44.entities.Message.create({ conversation_id: activeConv, body, is_quick: isQuick });
      setMessages((p) => [msg, ...p]);
      setDraft('');
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 glass-strong border-b border-border px-4 py-4">
        <h1 className="font-display text-xl font-bold">Messages</h1>
      </header>

      <div className="mx-auto max-w-lg">
        {loading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : convList.length === 0 ? (
          <div className="mt-12 flex flex-col items-center text-center">
            <MessageSquare size={40} className="text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No messages yet</p>
            <Link to="/" className="mt-3 text-sm text-primary">Find parking</Link>
          </div>
        ) : !active ? (
          <div className="divide-y divide-border">
            {convList.map((c) => (
              <button key={c.id} onClick={() => setActiveConv(c.id)} className="flex w-full items-center gap-3 p-4 text-left hover:bg-card">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <MessageSquare size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{c.msgs[0]?.body?.slice(0, 40)}</p>
                  <p className="text-xs text-muted-foreground">{c.msgs.length} messages</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex h-[calc(100dvh-80px)] flex-col">
            <div className="flex items-center gap-2 border-b border-border p-3">
              <button onClick={() => setActiveConv(null)} className="text-muted-foreground"><ArrowLeft size={18} /></button>
              <p className="text-sm font-semibold">Conversation</p>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {active.msgs.map((m) => (
                <div key={m.id} className={cn('max-w-[75%] rounded-2xl px-3 py-2 text-sm', m.created_by_id === user?.id ? 'ml-auto bg-primary text-primary-foreground' : 'bg-card border border-border')}>
                  {m.body}
                </div>
              ))}
            </div>
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto border-t border-border p-2">
              {QUICK_MESSAGES.map((q) => (
                <button key={q} onClick={() => send(q, true)} className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-primary">{q}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 border-t border-border p-3 pb-[calc(env(safe-area-inset-bottom)+8px)]">
              <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send(draft)} placeholder="Type a message…" className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none" />
              <button onClick={() => send(draft)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Send size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useEffect, useState } from "react";
import { appParams } from "@/lib/app-params";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

// App-side OAuth consent page for the app's MCP server. The platform redirects
// AI clients here (see base44/mcp/config.json `consent_path`) with an opaque
// `ctx` handle — the authorization request itself lives on the server. This page
// gates on the app-user session, fetches the display info for that handle, shows
// the categories of access being granted, and posts the approve/deny decision.
// Do not change the fetch calls, headers, or the `ctx` handle handling — styling
// and copy are safe to edit.
export default function OAuthConsent() {
  const ctx = new URLSearchParams(window.location.search).get("ctx");
  const [info, setInfo] = useState(null);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [decided, setDecided] = useState("");
  const [error, setError] = useState("");
  const [reconnect, setReconnect] = useState("");

  useEffect(() => {
    (async () => {
      let redirecting = false;
      try {
        if (!ctx) {
          setError("This authorization link is invalid or has expired.");
          return;
        }
        // Resolve the handle first: a dead handle must never render
        // approve/deny, and the response carries the app's configured login
        // route for the signed-out redirect below. Send the session (cookie +
        // bearer token) so the server can list the granted tools for a
        // signed-in user — the same auth the approve/deny call sends; without
        // it the display request is anonymous and shows no tools.
        const infoHeaders = {};
        if (appParams.token) infoHeaders.Authorization = "Bearer " + appParams.token;
        const res = await fetch(
          `/api/apps/${appParams.appId}/mcp/consent-info?handle=${encodeURIComponent(ctx)}`,
          { credentials: "include", headers: infoHeaders },
        );
        if (!res.ok) {
          setError("This authorization link is invalid or has expired.");
          return;
        }
        const data = await res.json();
        // Gate on the server's auth result, NOT base44.auth.isAuthenticated():
        // the SDK check runs the bearer path, so a cookie-only session (platform
        // login/SSO, or a private app with a stale localStorage token) would read
        // as signed-out and redirect — even though /consent-info just
        // authenticated this same request via its cookie fallback. data.authenticated
        // keeps the redirect decision in agreement with what the server returned.
        if (!data.authenticated) {
          // The short handle rides back in returnTo; login_path is
          // owner-configured and validated server-side as a same-origin path.
          // Send from_url too: a custom-auth app coerced to platform auth (e.g.
          // public_without_login under workspace SSO) serves the platform login,
          // which honors from_url rather than returnTo. Rebuild the query from
          // `ctx` alone — never forward window.location.search raw: the platform
          // resume returns from_url verbatim, so crafted extras on the consent
          // link (app_base_url, access_token, …) would ride through the login
          // round-trip and app-params.js would persist them into the freshly
          // authenticated session.
          const returnTo =
            window.location.pathname + "?ctx=" + encodeURIComponent(ctx);
          const encoded = encodeURIComponent(returnTo);
          redirecting = true; // keep the spinner while the browser navigates
          window.location.href =
            (data.login_path || "/login") + "?returnTo=" + encoded + "&from_url=" + encoded;
          return;
        }
        setInfo(data);
      } catch (e) {
        setError("Could not load this authorization request. Please try again.");
      } finally {
        if (!redirecting) setChecking(false);
      }
    })();
  }, [ctx]);

  const respond = async (action) => {
    setSubmitting(true);
    setError("");
    try {
      const headers = { "Content-Type": "application/json" };
      // Cookie-backed sessions carry no token; sending "Bearer null" would
      // shadow the valid cookie, so add the header only when a token exists.
      if (appParams.token) headers.Authorization = "Bearer " + appParams.token;
      const res = await fetch(`/api/apps/${appParams.appId}/mcp/authorize-grant`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ ctx, action }),
      });
      if (!res.ok) {
        // 401 = the session expired before the (single-use, still-unconsumed)
        // handle was spent; retrying the same controls re-sends the dead session
        // forever. Send the user back through login preserving `ctx` — the same
        // redirect the initial signed-out path uses — so they can return and
        // approve the still-valid handle.
        if (res.status === 401) {
          const returnTo = window.location.pathname + "?ctx=" + encodeURIComponent(ctx);
          const encoded = encodeURIComponent(returnTo);
          window.location.href =
            ((info && info.login_path) || "/login") + "?returnTo=" + encoded + "&from_url=" + encoded;
          return;
        }
        // These all come AFTER the single-use handle is atomically consumed
        // (409 tool set changed; 403 host/resource/app mismatch; 404 access
        // gone; 400 malformed/handle already used), so retrying can only 404.
        // Show a terminal reconnect state, not an impossible "try again".
        if ([400, 403, 404, 409].includes(res.status)) {
          let detail = "";
          try { detail = (await res.json()).detail; } catch (_) { /* keep default */ }
          setReconnect(detail || "This authorization can no longer be completed. Reconnect from your AI client to try again.");
          setSubmitting(false);
          return;
        }
        throw new Error("Could not complete authorization. Please try again.");
      }
      const data = await res.json();
      window.location.href = data.redirect_url;
      if (!/^https?:/i.test(data.redirect_url)) {
        // Custom-scheme redirect (native AI clients, e.g. cursor://): browsers
        // may block or not visibly navigate, so show a terminal state instead
        // of an eternal spinner.
        setDecided(action);
        setSubmitting(false);
      }
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <AuthLayout icon={ShieldCheck} title="Authorize access">
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
          Loading…
        </div>
      </AuthLayout>
    );
  }

  const client = (info && info.client_name) || "An AI client";
  const appName = (info && info.app_name) || "this app";

  if (decided) {
    return (
      <AuthLayout
        icon={ShieldCheck}
        title={decided === "approve" ? "Access granted" : "Access denied"}
        subtitle={`You can return to ${client} and close this window.`}
      />
    );
  }

  // Terminal: the authorization request is no longer valid (tool set changed +
  // handle consumed). Retrying can't succeed, so show reconnect guidance with
  // no approve/deny controls.
  if (reconnect) {
    return (
      <AuthLayout icon={ShieldCheck} title="Reconnect required">
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {reconnect}
        </div>
      </AuthLayout>
    );
  }

  // No consent details means nothing trustworthy to approve: a failed
  // consent-info load (expired handle, rate limit, transient error) renders
  // the error alone, never the approve/deny controls.
  if (error && !info) {
    return (
      <AuthLayout icon={ShieldCheck} title="Authorize access">
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      </AuthLayout>
    );
  }

  const tools = Array.isArray(info.tools) ? info.tools : [];

  return (
    <AuthLayout
      icon={ShieldCheck}
      title="Authorize access"
      subtitle={`${client} wants to access ${appName} on your behalf`}
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <p className="text-sm font-medium text-foreground mb-2">
        {tools.length ? `It will be able to use these tools in ${appName}:` : "No tools requested"}
      </p>
      {tools.length > 0 && (
        <ul className="space-y-2 text-sm mb-6">
          {tools.map((tool) => (
            <li key={tool.name} className="flex flex-col">
              <span className="text-foreground font-medium">
                {tool.title || tool.name}
              </span>
              {tool.description && (
                <span className="text-muted-foreground">{tool.description}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 h-12 font-medium"
          disabled={submitting}
          onClick={() => respond("deny")}
        >
          Deny
        </Button>
        <Button
          className="flex-1 h-12 font-medium"
          disabled={submitting}
          onClick={() => respond("approve")}
        >
          {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Approve
        </Button>
      </div>
    </AuthLayout>
  );
}
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Plus, CreditCard, Bell, HelpCircle, Shield, LogOut, ChevronRight, X, Zap, Heart, Calendar, Home } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const VEHICLE_TYPES = ['compact', 'sedan', 'suv', 'truck', 'van', 'motorcycle', 'other'];
const CONNECTORS = ['none', 'nacs', 'ccs', 'chademo', 'j1772', 'tesla'];

const VEHICLE_DIMS = {
  compact: { length_mm: 4200, width_mm: 1750, height_mm: 1450 },
  sedan: { length_mm: 4700, width_mm: 1820, height_mm: 1450 },
  suv: { length_mm: 4900, width_mm: 1950, height_mm: 1750 },
  truck: { length_mm: 5800, width_mm: 2100, height_mm: 1900 },
  van: { length_mm: 5200, width_mm: 2000, height_mm: 2000 },
  motorcycle: { length_mm: 2200, width_mm: 900, height_mm: 1200 },
  other: { length_mm: 4800, width_mm: 1900, height_mm: 1500 },
};

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    (async () => {
      try { setVehicles(await base44.entities.Vehicle.list('-created_date', 50)); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleLogout = () => { logout(); };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 glass-strong border-b border-border px-4 py-4">
        <h1 className="font-display text-xl font-bold">Profile</h1>
      </header>

      <div className="mx-auto max-w-lg space-y-4 p-4">
        {/* User */}
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 font-display text-lg font-bold text-primary">
            {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-display text-base font-semibold">{user?.full_name || 'Driver'}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {/* Vehicles */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold"><Car size={16} className="text-primary" /> My Vehicles</div>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 text-xs text-primary"><Plus size={14} /> Add</button>
          </div>
          <div className="mt-3 space-y-2">
            {loading && <p className="text-xs text-muted-foreground">Loading…</p>}
            {!loading && vehicles.length === 0 && <p className="text-xs text-muted-foreground">No vehicles added</p>}
            {vehicles.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                <div className="flex items-center gap-2">
                  <Car size={16} className="text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{v.make} {v.model} {v.year || ''}</p>
                    <p className="text-xs text-muted-foreground">{v.license_plate || 'No plate'} • {v.fuel_type}{v.fuel_type === 'electric' && v.connector ? ` • ${v.connector.toUpperCase()}` : ''}</p>
                  </div>
                </div>
                {v.is_default && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">Default</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Host */}
        <Link to="/host" className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:border-primary/40">
          <div className="flex items-center gap-2 text-sm font-semibold"><Home size={16} className="text-primary" /> Become a Host</div>
          <ChevronRight size={18} className="text-muted-foreground" />
        </Link>

        {/* Menu */}
        <div className="divide-y divide-border rounded-2xl border border-border bg-card">
          {[
            { icon: CreditCard, label: 'Payment Methods' },
            { icon: Bell, label: 'Notifications' },
            { icon: Shield, label: 'Legal & Privacy' },
            { icon: HelpCircle, label: 'Support' },
          ].map((item) => (
            <button key={item.label} className="flex w-full items-center justify-between p-4 text-left">
              <span className="flex items-center gap-2 text-sm"><item.icon size={16} className="text-muted-foreground" /> {item.label}</span>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>
          ))}
        </div>

        <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm font-medium text-destructive hover:bg-destructive/5">
          <LogOut size={16} /> Log Out
        </button>
      </div>

      {showAdd && <AddVehicleModal onClose={() => setShowAdd(false)} onAdded={(v) => { setVehicles((p) => [v, ...p]); setShowAdd(false); }} />}
    </div>
  );
}

function AddVehicleModal({ onClose, onAdded }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ make: '', model: '', year: '', license_plate: '', vehicle_type: 'sedan', fuel_type: 'gas', connector: 'none', is_default: false });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dims = VEHICLE_DIMS[form.vehicle_type] || VEHICLE_DIMS.other;
      const v = await base44.entities.Vehicle.create({ ...form, year: form.year ? parseInt(form.year) : undefined, ...dims });
      toast({ title: 'Vehicle added' });
      onAdded(v);
    } catch (e) {
      toast({ title: 'Failed to add vehicle', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[800] flex items-end justify-center bg-black/60 md:items-center" onClick={onClose}>
      <div className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-card p-5 md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Add Vehicle</h2>
          <button onClick={onClose}><X size={20} className="text-muted-foreground" /></button>
        </div>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Make" value={form.make} onChange={(v) => setForm({ ...form, make: v })} placeholder="Tesla" required />
            <Field label="Model" value={form.model} onChange={(v) => setForm({ ...form, model: v })} placeholder="Model Y" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Year" value={form.year} onChange={(v) => setForm({ ...form, year: v })} placeholder="2026" type="number" />
            <Field label="License Plate" value={form.license_plate} onChange={(v) => setForm({ ...form, license_plate: v })} placeholder="ABC-1234" />
          </div>
          <Select label="Vehicle Type" value={form.vehicle_type} onChange={(v) => setForm({ ...form, vehicle_type: v })} options={VEHICLE_TYPES} />
          <Select label="Fuel Type" value={form.fuel_type} onChange={(v) => setForm({ ...form, fuel_type: v, connector: v === 'electric' ? form.connector : 'none' })} options={['gas', 'hybrid', 'electric']} />
          {form.fuel_type === 'electric' && (
            <Select label="Charging Connector" value={form.connector} onChange={(v) => setForm({ ...form, connector: v })} options={CONNECTORS.filter((c) => c !== 'none')} />
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} className="h-4 w-4 rounded border-border accent-primary" />
            Set as default vehicle
          </label>
          <button type="submit" disabled={saving} className="w-full rounded-xl bg-primary py-3 font-display text-sm font-bold text-primary-foreground disabled:opacity-50">
            {saving ? 'Adding…' : 'Add Vehicle'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', required }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none" />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm capitalize focus:outline-none">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      window.location.href = safeReturnTo();
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({
        title: "Code sent",
        description: "Check your email for the new code.",
      });
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", safeReturnTo());
  };

  if (showOtp) {
    return (
      <AuthLayout
        icon={Mail}
        title="Verify your email"
        subtitle={`We sent a code to ${email}`}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        <div className="flex justify-center mb-6">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={setOtpCode}
            autoFocus
            autoComplete="one-time-code"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button
          className="w-full h-12 font-medium"
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify"
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Didn't receive the code?{" "}
          <button onClick={handleResend} className="text-primary font-medium hover:underline">
            Resend
          </button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title="Create your account"
      subtitle="Sign up to get started"
      footer={
        <>
          Already have an account?{" "}
          <Link
            to={"/login" + (safeReturnTo() !== "/" ? "?returnTo=" + encodeURIComponent(safeReturnTo()) : "")}
            className="text-primary font-medium hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continue with Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">or</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

const REPORT_REASONS = [
  'Space occupied',
  'Cannot access parking',
  'Incorrect address',
  'Space too small',
  'Host unavailable',
  'Charger not working',
  'Safety concern',
  'Other',
];

export default function Report() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!reason) { toast({ title: 'Select a reason', variant: 'destructive' }); return; }
    setSubmitting(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: 'support@voltpark.app',
        subject: `Problem reported for reservation ${id}: ${reason}`,
        body: `Reason: ${reason}\nDetails: ${details}`,
      });
      toast({ title: 'Report submitted. We’ll help resolve this.' });
      navigate('/trips');
    } catch (e) {
      toast({ title: 'Failed to submit report', variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 glass-strong flex items-center gap-3 border-b border-border px-4 py-3">
        <Link to="/trips" className="text-muted-foreground hover:text-primary"><ArrowLeft size={20} /></Link>
        <h1 className="font-display text-base font-bold">Report a Problem</h1>
      </header>

      <form onSubmit={submit} className="mx-auto max-w-lg space-y-4 p-4">
        <div className="flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
          <AlertTriangle size={16} /> If the space is unavailable, we’ll help find another.
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-semibold">What’s the issue?</p>
          <div className="mt-3 space-y-1.5">
            {REPORT_REASONS.map((r) => (
              <button type="button" key={r} onClick={() => setReason(r)} className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm ${reason === r ? 'border-primary bg-primary/5' : 'border-border'}`}>
                {r}
                {reason === r && <span className="text-primary">✓</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-semibold">Details (optional)</p>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={4} placeholder="Describe what happened…" className="mt-2 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none" />
          <button type="button" className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><Camera size={14} /> Add photo</button>
        </div>

        <button type="submit" disabled={submitting} className="w-full rounded-xl bg-primary py-3.5 font-display text-sm font-bold text-primary-foreground disabled:opacity-50">
          {submitting ? 'Submitting…' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}
import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword });
      window.location.href = "/login";
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title="Invalid reset link"
        subtitle="This password reset link is missing or invalid"
        footer={
          <Link to="/forgot-password" className="text-primary font-medium hover:underline">
            Request a new link
          </Link>
        }
      >
        <p className="text-sm text-foreground text-center">
          The link you used appears to be incomplete. Please request a new password reset email.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Lock}
      title="New password"
      subtitle="Enter your new password below"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Resetting...
            </>
          ) : (
            "Reset password"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Zap, Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatDistance, walkTimeMinutes, distanceMiles, chargerLabel } from '@/lib/parking';
import { Image } from '@/components/ui/image';

export default function Saved() {
  const [saved, setSaved] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const ids = JSON.parse(localStorage.getItem('savedSpaces') || '[]');
      setSaved(ids);
      try {
        const all = await base44.entities.ParkingSpace.filter({ status: 'active' }, '-rating', 100);
        setSpaces(all.filter((s) => ids.includes(s.id)));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const removeSaved = (id) => {
    const next = saved.filter((x) => x !== id);
    localStorage.setItem('savedSpaces', JSON.stringify(next));
    setSaved(next);
    setSpaces((p) => p.filter((s) => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 glass-strong border-b border-border px-4 py-4">
        <h1 className="font-display text-xl font-bold">Saved</h1>
      </header>

      <div className="mx-auto max-w-lg space-y-3 p-4">
        {loading && <p className="text-center text-sm text-muted-foreground">Loading…</p>}
        {!loading && spaces.length === 0 && (
          <div className="mt-12 flex flex-col items-center text-center">
            <Heart size={40} className="text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No saved parking yet</p>
            <Link to="/" className="mt-3 text-sm text-primary">Find parking</Link>
          </div>
        )}
        {spaces.map((s) => (
          <div key={s.id} className="rounded-2xl border border-border bg-card p-3">
            <div className="flex gap-3">
              <Link to={`/booking/${s.id}?hours=1`} className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                {s.photos?.[0] && <Image src={s.photos[0]} fittingType="fill" className="h-full w-full" />}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between">
                  <Link to={`/booking/${s.id}?hours=1`} className="truncate font-display text-sm font-semibold">{s.title}</Link>
                  <button onClick={() => removeSaved(s.id)} className="text-muted-foreground hover:text-primary"><Heart size={16} className="fill-primary text-primary" /></button>
                </div>
                <p className="truncate text-xs text-muted-foreground">{s.neighborhood}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Star size={11} className="fill-primary text-primary" /> {s.rating?.toFixed(1) || 'New'}
                  {s.has_ev_charging && <span className="text-secondary">⚡ {chargerLabel(s.charger_level)}</span>}
                </div>
                <div className="mt-auto flex items-end justify-between pt-1.5">
                  <span className="font-display text-base font-bold text-primary">${s.hourly_price}<span className="text-[11px] text-muted-foreground">/hr</span></span>
                  <Link to={`/booking/${s.id}?hours=1`} className="rounded-lg border border-primary px-3 py-1 text-xs font-medium text-primary">Rebook</Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Car, Zap, Star, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { loadUserReservations } from '@/lib/parking';

export default function Trips() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');
  const now = new Date();

  useEffect(() => {
    (async () => {
      try { setReservations(await loadUserReservations()); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const grouped = {
    active: reservations.filter((r) => r.status === 'active' || (r.status === 'upcoming' && new Date(r.start_time) <= now && new Date(r.end_time) >= now)),
    upcoming: reservations.filter((r) => r.status === 'upcoming' && new Date(r.start_time) > now),
    past: reservations.filter((r) => r.status === 'completed' || new Date(r.end_time) < now),
  };

  const list = grouped[tab] || [];

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 glass-strong border-b border-border px-4 py-4">
        <h1 className="font-display text-xl font-bold">Trips</h1>
      </header>

      <div className="mx-auto max-w-lg p-4">
        <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
          {['active', 'upcoming', 'past'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn('flex-1 rounded-lg py-2 text-sm font-medium capitalize', tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>
              {t}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {loading && <p className="text-center text-sm text-muted-foreground">Loading…</p>}
          {!loading && list.length === 0 && <p className="mt-8 text-center text-sm text-muted-foreground">No {tab} trips</p>}
          {list.map((r) => {
            const start = new Date(r.start_time);
            const end = new Date(r.end_time);
            const isActive = tab === 'active';
            return (
              <Link key={r.id} to={isActive ? `/active/${r.id}` : `/confirmation/${r.id}`} className="block rounded-2xl border border-border bg-card p-4 hover:border-primary/40">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="mt-0.5 text-primary" />
                    <div>
                      <p className="text-sm font-semibold">{r.parking_space_title}</p>
                      <p className="text-xs text-muted-foreground">{r.parking_space_address}</p>
                    </div>
                  </div>
                  <span className="font-display text-sm font-bold">${r.total?.toFixed(2)}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar size={11} /> {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <span className="flex items-center gap-1"><Clock size={11} /> {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} – {end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                  <span className="flex items-center gap-1"><Car size={11} /> {r.vehicle_label}</span>
                  {r.has_charging && <span className="flex items-center gap-1 text-secondary"><Zap size={11} /> Charging</span>}
                </div>
                {tab === 'past' && r.status === 'completed' && (
                  <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                    <span className="text-xs text-muted-foreground">Rate this trip</span>
                    <Star size={14} className="text-primary" />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
