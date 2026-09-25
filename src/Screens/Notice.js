import React, {useState} from 'react';
import FeedScreen from '../Components/ContentFeedScreen';
import NoticeCard from '../Components/NoticeCard';
import NoticeDetailSheet from '../Components/NoticeDetailSheet';
import {useApp} from '../Context/AppContext';

const SEARCH_KEYS = ['title', 'source', 'text', 'tag'];

export default function Notice() {
  const {noticeTree, read, markRead} = useApp();
  const [selected, setSelected] = useState(null);

  const open = item => {
    markRead(item.id);
    setSelected(item);
  };

  return (
    <>
      <FeedScreen
        title="Notices"
        subtitle="Stay updated"
        noun="notice"
        data={noticeTree}
        searchKeys={SEARCH_KEYS}
        searchPlaceholder="Search notices…"
        renderItem={item => (
          <NoticeCard key={item.id} item={item} unread={!read[item.id]} onPress={() => open(item)} />
        )}
      />
      <NoticeDetailSheet notice={selected} visible={!!selected} onClose={() => setSelected(null)} />
    </>
  );
}
