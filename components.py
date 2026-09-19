import React from "react";

export default function GoogleIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

#card
import { Link } from 'react-router-dom';
import { Star, Zap, ShieldCheck, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistance, walkTimeMinutes, chargerLabel } from '@/lib/parking';
import { Image } from '@/components/ui/image';

export default function ParkingCard({ space, userLat, userLng, onClick, compact }) {
  const dist = userLat && userLng ? distanceMilesCalc(userLat, userLng, space.lat, space.lng) : null;
  return (
    <div
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-2xl border border-border bg-card p-3 transition-all hover:border-primary/40',
        compact && 'p-2.5'
      )}
    >
      <div className="flex gap-3">
        <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
          {space.photos?.[0] ? (
            <Image src={space.photos[0]} fittingType="fill" className="h-full w-full" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">No photo</div>
          )}
          {space.has_ev_charging && (
            <div className="absolute right-1 top-1 rounded-md bg-secondary/90 px-1 py-0.5 text-[9px] font-bold text-white">
              ⚡ {chargerLabel(space.charger_level)}
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-display text-sm font-semibold">{space.title}</h3>
            <div className="flex shrink-0 items-center gap-0.5 text-xs">
              <Star size={12} className="fill-primary text-primary" />
              <span className="font-medium">{space.rating?.toFixed(1) || 'New'}</span>
            </div>
          </div>
          <p className="truncate text-xs text-muted-foreground">{space.neighborhood || space.address}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
            {dist != null && (
              <span>{formatDistance(dist)} • {walkTimeMinutes(dist)} min walk</span>
            )}
            {space.verified && (
              <span className="flex items-center gap-0.5 text-secondary">
                <ShieldCheck size={11} /> Verified
              </span>
            )}
            {space.access_24_7 && (
              <span className="flex items-center gap-0.5"><Clock size={11} /> 24/7</span>
            )}
          </div>
          <div className="mt-auto flex items-end justify-between pt-1.5">
            <div>
              <span className="font-display text-base font-bold text-primary">${space.hourly_price}</span>
              <span className="text-[11px] text-muted-foreground">/hr</span>
            </div>
            {space.has_ev_charging && (
              <span className="flex items-center gap-0.5 text-[11px] font-medium text-secondary">
                <Zap size={11} /> ${space.charging_price_kwh?.toFixed(2)}/kWh
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function distanceMilesCalc(lat1, lng1, lat2, lng2) {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
import { cn } from '@/lib/utils';
import { chargerSpeed } from '@/lib/parking';

// Custom div-icon HTML for Leaflet pins
export function pinHTML(space, active) {
  const ev = space.has_ev_charging ? chargerSpeed(space.charger_level) : '';
  const cls = active
    ? 'map-pin-glow border-primary text-primary'
    : space.has_ev_charging
    ? 'ev-glow border-secondary text-secondary'
    : 'border-border text-foreground';
  return `<div class="flex flex-col items-center">
    <div class="${cls} glass flex items-center gap-0.5 rounded-full border px-2.5 py-1 text-xs font-bold font-display whitespace-nowrap" style="min-width:42px">
      <span>$${space.hourly_price}</span>
      <span class="text-[10px] opacity-70">/hr</span>
      ${ev ? `<span class="ml-0.5">${ev}</span>` : ''}
    </div>
    <div class="mt-0.5 h-2 w-2 rotate-45 ${active ? 'bg-primary' : space.has_ev_charging ? 'bg-secondary' : 'bg-card'} border-x border-b border-border"></div>
  </div>`;
}

export function PinBadge({ space, active, onClick }) {
  const ev = space.has_ev_charging ? chargerSpeed(space.charger_level) : '';
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center transition-transform',
        active ? 'scale-110' : 'scale-100 hover:scale-105'
      )}
    >
      <div
        className={cn(
          'glass flex items-center gap-0.5 rounded-full border px-2.5 py-1 text-xs font-bold font-display whitespace-nowrap',
          active
            ? 'map-pin-glow border-primary text-primary'
            : space.has_ev_charging
            ? 'ev-glow border-secondary text-secondary'
            : 'border-border text-foreground'
        )}
      >
        <span>${space.hourly_price}</span>
        <span className="text-[10px] opacity-70">/hr</span>
        {ev && <span className="ml-0.5">{ev}</span>}
      </div>
      <div
        className={cn(
          'mt-0.5 h-2 w-2 rotate-45 border-x border-b border-border',
          active ? 'bg-primary' : space.has_ev_charging ? 'bg-secondary' : 'bg-card'
        )}
      />
    </button>
  );
}
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

export default function ProtectedRoute({ fallback = <DefaultFallback />, unauthenticatedElement }) {
  const { isAuthenticated, isLoadingAuth, authChecked, authError, checkUserAuth } = useAuth();

  useEffect(() => {
    if (!authChecked && !isLoadingAuth) {
      checkUserAuth();
    }
  }, [authChecked, isLoadingAuth, checkUserAuth]);

  if (isLoadingAuth || !authChecked) {
    return fallback;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    return unauthenticatedElement;
  }

  if (!isAuthenticated) {
    return unauthenticatedElement;
  }

  return <Outlet />;
}
import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const getHashId = (hash) => {
  const rawId = hash.slice(1);

  try {
    return decodeURIComponent(rawId);
  } catch {
    return rawId;
  }
};

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === "POP") return;

    if (hash) {
      const id = getHashId(hash);
      const timer = window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 50);
      return () => window.clearTimeout(timer);
    }

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash, navigationType]);

  return null;
}
import React from 'react';

const UserNotRegisteredError = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg border border-slate-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-orange-100">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Access Restricted</h1>
          <p className="text-slate-600 mb-8">
            You are not registered to use this application. Please contact the app administrator to request access.
          </p>
          <div className="p-4 bg-slate-50 rounded-md text-sm text-slate-600">
            <p>If you believe this is an error, you can:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Verify you are logged in with the correct account</li>
              <li>Contact the app administrator for access</li>
              <li>Try logging out and back in again</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
import { Check, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VehicleFitBadge({ fits, label }) {
  const isFit = fits === true;
  const isWarn = fits === false;
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
        isFit && 'border-secondary bg-secondary/15 text-secondary',
        isWarn && 'border-primary bg-primary/15 text-primary',
        fits === null && 'border-border bg-muted text-muted-foreground'
      )}
    >
      {isFit && <Check size={14} />}
      {isWarn && <AlertTriangle size={14} />}
      {label}
    </div>
  );
}
