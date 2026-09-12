import React from 'react';
import ReactDOM from 'react-dom/client';
import Admin from './Admin';
import EventsManager from './EventsManager';
import TicketsManager from './TicketsManager';
import '../index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Admin
      tabs={[
        { id: 'events', label: 'Events', content: <EventsManager /> },
        { id: 'tickets', label: 'Bookings & Gate', content: <TicketsManager /> },
      ]}
    />
  </React.StrictMode>,
);
