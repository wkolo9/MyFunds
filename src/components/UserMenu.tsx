import React, { useState, useEffect, useRef } from 'react';
import { User, LogOut, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', newTheme);
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  if (!mounted) {
    return (
      <div className="p-2 text-muted-foreground">
        <User className="w-6 h-6" />
      </div>
    );
  }

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        className={cn(
          "p-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer",
          isOpen && "text-foreground"
        )}
      >
        <User className="w-6 h-6" />
      </div>

      {isOpen && (
        <div className="absolute right-0 top-full pt-2 w-48 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="rounded-md border bg-card text-card-foreground shadow-md">
            <div className="p-1">
              <a 
                href="/profile" 
                className="flex items-center gap-2 px-2 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                 <User className="w-4 h-4" />
                 Profile
              </a>
              <button 
                onClick={toggleTheme} 
                className="flex w-full items-center gap-2 px-2 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
              <div className="h-px bg-border my-1" />
              <form action="/api/auth/logout" method="POST" className="w-full">
                <button 
                  type="submit" 
                  className="flex w-full items-center gap-2 px-2 py-2 text-sm rounded-sm hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
                >
                   <LogOut className="w-4 h-4" />
                   Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
