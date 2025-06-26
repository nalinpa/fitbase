// src/pages/CalendarViewPage.tsx - Refactored to use Cloud Functions
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { enUS } from 'date-fns/locale';
import CalendarToolbar from '../components/CalendarToolbar';
import PageHeader from '../components/ui/PageHeader';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export default function CalendarViewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<View>(Views.MONTH);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchCalendarData();
  }, [user, date]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range based on current view
      const start = startOfMonth(addMonths(date, -1));
      const end = endOfMonth(addMonths(date, 1));
      console.log(start, end);

      const getCalendar = httpsCallable(functions, 'getCalendarData');
      const result = await getCalendar({
        startDate: start.toISOString(),
        endDate: end.toISOString()
      });

      const data = result.data as any;
      
      // Transform events for react-big-calendar
      const calendarEvents = data.events.map((event: any) => ({
        id: event.id,
        title: event.title,
        start: new Date(event.date),
        end: new Date(event.date),
        allDay: true,
        resource: event // Store original data for onClick
      }));

      setEvents(calendarEvents);
    } catch (error: any) {
      console.error("Error fetching calendar data:", error);
      setError(error.message || "Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  const handleSelectEvent = (event: any) => {
    navigate(`/workout/history/${event.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchCalendarData}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workout Calendar"
        subtitle="A visual overview of your completed workout sessions."
      />
      
      <div className="bg-white rounded-lg shadow-md">
        <div style={{ height: '75vh' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            date={date}
            onNavigate={handleNavigate}
            onSelectEvent={handleSelectEvent}
            view={view}
            views={['month', 'week']}
            onView={(newView) => setView(newView)}
            eventPropGetter={(event) => ({
              className: 'bg-indigo-500 text-white border-0 p-1 rounded-md cursor-pointer hover:bg-indigo-700',
            })}
            components={{
              toolbar: CalendarToolbar,
            }}
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <p className="text-sm text-gray-600">This Month</p>
          <p className="text-2xl font-bold text-indigo-600">
            {events.filter(e => {
              const eventMonth = e.start.getMonth();
              const currentMonth = date.getMonth();
              return eventMonth === currentMonth;
            }).length} workouts
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <p className="text-sm text-gray-600">This Week</p>
          <p className="text-2xl font-bold text-green-600">
            {events.filter(e => {
              const eventWeek = format(e.start, 'w');
              const currentWeek = format(date, 'w');
              return eventWeek === currentWeek;
            }).length} workouts
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <p className="text-sm text-gray-600">Total Tracked</p>
          <p className="text-2xl font-bold text-purple-600">
            {events.length} workouts
          </p>
        </div>
      </div>
    </div>
  );
}