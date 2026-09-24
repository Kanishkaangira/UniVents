import React, {useState} from 'react';
import FeedScreen from '../Components/FeedScreen';
import EventCard from '../Components/EventCard';
import EventDetailSheet from '../Components/EventDetailSheet';
import {EVENTS} from '../Data/data';
import {useApp} from '../Context/AppContext';

const SEARCH_KEYS = ['title', 'org', 'venue', 'date'];

export default function Events() {
  const {saved, toggleSave} = useApp();
  const [selected, setSelected] = useState(null);

  return (
    <>
      <FeedScreen
        title="Events"
        subtitle="Discover what is on"
        noun="event"
        data={EVENTS}
        searchKeys={SEARCH_KEYS}
        searchPlaceholder="Search events, venues, faculties…"
        renderItem={item => (
          <EventCard
            key={item.id}
            item={item}
            saved={!!saved[item.id]}
            onToggleSave={() => toggleSave(item.id)}
            onPress={() => setSelected(item)}
          />
        )}
      />
      <EventDetailSheet event={selected} visible={!!selected} onClose={() => setSelected(null)} />
    </>
  );
}
