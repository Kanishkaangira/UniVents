import React, {useState} from 'react';
import FeedScreen from '../Components/ContentFeedScreen';
import EventCard from '../Components/EventCard';
import EventDetailSheet from '../Components/EventDetailSheet';
import {useApp} from '../Context/AppContext';

const SEARCH_KEYS = ['title', 'org', 'venue', 'date', 'category'];

export default function Events() {
  const {eventTree, saved, toggleSave} = useApp();
  const [selected, setSelected] = useState(null);

  return (
    <>
      <FeedScreen
        title="Events"
        subtitle="Discover what is on"
        noun="event"
        data={eventTree}
        searchKeys={SEARCH_KEYS}
        searchPlaceholder="Search events, venues, departments…"
        renderItem={item => (
          <EventCard
            key={item.id}
            item={item}
            large
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
