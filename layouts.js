import React from "react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
            <Icon className="w-7 h-7 text-primary-foreground" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
        </div>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Map as MapIcon, Calendar, Heart, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { label: 'Map', path: '/', icon: MapIcon },
  { label: 'Trips', path: '/trips', icon: Calendar },
  { label: 'Saved', path: '/saved', icon: Heart },
  { label: 'Messages', path: '/messages', icon: MessageSquare },
  { label: 'Profile', path: '/profile', icon: User },
];

export default function DriverLayout() {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
      <nav className="fixed bottom-0 left-0 right-0 z-[1000] glass-strong border-t border-border">
        <div className="mx-auto flex max-w-md items-center justify-around px-2 py-1.5 pb-[calc(env(safe-area-inset-bottom)+6px)]">
          {tabs.map((tab) => {
            const active = location.pathname === tab.path;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={cn(
                  'flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
