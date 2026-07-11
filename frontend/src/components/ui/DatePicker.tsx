import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  error?: string;
  hint?: string;
  disablePastDates?: boolean;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DatePicker({ value, onChange, label, error, hint, disablePastDates }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const initialDate = value ? new Date(value) : new Date();
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
  
  const [timeStr, setTimeStr] = useState(() => {
    if (!value) return "12:00";
    const d = new Date(value);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });

  // Sync state if value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setSelectedDate(d);
      setCurrentMonth(d.getMonth());
      setCurrentYear(d.getFullYear());
      setTimeStr(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  // Removed document mousedown listener in favor of fixed overlay

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    const [hours, minutes] = timeStr.split(':').map(Number);
    newDate.setHours(hours || 0, minutes || 0);
    setSelectedDate(newDate);
    onChange(newDate.toISOString());
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTimeStr(newTime);
    if (selectedDate) {
      const [hours, minutes] = newTime.split(':').map(Number);
      const updated = new Date(selectedDate);
      updated.setHours(hours, minutes);
      setSelectedDate(updated);
      onChange(updated.toISOString());
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(null);
    onChange(null);
    setIsOpen(false);
  };

  const displayValue = selectedDate ? selectedDate.toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : "";

  return (
    <div className="flex flex-col gap-1.5 relative">
      {label && (
        <label className="text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-9 w-full rounded-lg border px-3 flex items-center justify-between text-sm cursor-pointer transition-all",
          "bg-surface shadow-sm",
          isOpen ? "border-brand-500 ring-4 ring-brand-500/10 border-brand-500 -translate-y-[1px]" : "border-border hover:border-text-muted/30",
          error && "border-red-400 ring-red-500/10",
        )}
      >
        <span className={cn(selectedDate ? "text-text-primary" : "text-text-muted")}>
          {displayValue || "Select date and time"}
        </span>
        
        <div className="flex items-center gap-1.5 text-text-muted">
          {selectedDate && (
            <button 
              type="button"
              onClick={handleClear}
              className="p-1 hover:text-text-primary rounded-full hover:bg-surface-muted transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <CalendarIcon className="h-4 w-4" />
        </div>
      </div>

      {error && <p className="text-xs text-red-500 animate-fade-in">{error}</p>}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 z-50 w-72 bg-surface border border-border rounded-xl shadow-2xl animate-scale-in overflow-hidden origin-top-left">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border bg-surface-muted/50">
            <button 
              onClick={handlePrevMonth} 
              type="button" 
              disabled={disablePastDates && new Date(currentYear, currentMonth, 1) <= new Date(new Date().getFullYear(), new Date().getMonth(), 1)}
              className={cn("p-1.5 rounded-lg transition-colors", disablePastDates && new Date(currentYear, currentMonth, 1) <= new Date(new Date().getFullYear(), new Date().getMonth(), 1) ? "opacity-30 cursor-not-allowed text-text-muted" : "hover:bg-surface-muted text-text-secondary hover:text-text-primary")}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-text-primary tracking-tight">
              {MONTHS[currentMonth]} {currentYear}
            </span>
            <button onClick={handleNextMonth} type="button" className="p-1.5 rounded-lg hover:bg-surface-muted text-text-secondary hover:text-text-primary transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-3">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map(d => (
                <div key={d} className="text-[10px] font-bold text-center text-text-muted uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === currentMonth && selectedDate?.getFullYear() === currentYear;
                const isToday = new Date().getDate() === day && new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear;
                
                const currentDate = new Date(currentYear, currentMonth, day);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isPast = disablePastDates && currentDate < today;
                
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={isPast}
                    onClick={() => handleDateClick(day)}
                    className={cn(
                      "h-8 w-full rounded-md flex items-center justify-center text-sm transition-all duration-200",
                      isPast 
                        ? "opacity-40 cursor-not-allowed line-through text-text-muted"
                        : isSelected 
                          ? "bg-brand-500 text-white font-medium shadow-sm scale-105" 
                          : isToday 
                            ? "bg-brand-50 text-brand-600 font-medium dark:bg-brand-500/10 dark:text-brand-400"
                            : "text-text-primary hover:bg-surface-muted hover:scale-110"
                    )}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>

            {/* Time Picker and Done */}
            <div className="p-3 border-t border-border bg-surface-muted/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-text-muted bg-surface border border-border rounded-lg px-2 py-1 shadow-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                  <Clock className="h-3.5 w-3.5" />
                  <input
                    type="time"
                    value={timeStr}
                    onChange={handleTimeChange}
                    className="bg-transparent text-sm font-medium text-text-primary focus:outline-none w-[72px]"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setIsOpen(false); }}
                className="px-3 py-1.5 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
      )}
    </div>
  );
}
