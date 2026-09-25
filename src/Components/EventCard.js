import React from 'react';
import {ImageBackground, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {colors, gradients, shadow} from '../Constants/theme';

export default function EventCard({item, saved, onPress, onToggleSave, compact, large = false}) {
  const [day, month] = item.date.split(' ');
  const organizerLabel = item.organizerScope === 'department' ? item.scopeLabel || item.departmentCode || item.org : item.org;
  const statusStyle = {
    live: [styles.eventStatusLive, styles.eventStatusText],
    completed: [styles.eventStatusCompleted, styles.eventStatusText],
    cancelled: [styles.eventStatusCancelled, styles.eventStatusText],
  }[item.status] || [styles.eventStatusUpcoming, styles.eventStatusText];
  if (large) {
    return (
      <TouchableOpacity activeOpacity={0.92} style={styles.largeCard} onPress={onPress}>
        {item.imageUrl ? (
          <ImageBackground source={{uri: item.imageUrl}} imageStyle={styles.largeImage} style={styles.largeHero}>
            <View style={styles.heroShade} />
            <DateBadge day={day} month={month} />
            {onToggleSave && <SaveButton saved={saved} onPress={onToggleSave} large />}
            <LinearGradient colors={['#086E70', '#0F9B8E']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.heroBottom}>
              <Icon name="pricetag-outline" size={12} color="#fff" />
              <Text style={styles.heroCategory}>{item.category || 'Campus event'}</Text>
            </LinearGradient>
            <View style={[styles.eventStatus, statusStyle[0]]}>
              <Text style={[styles.eventStatusText, statusStyle[1]]}>{item.status || 'upcoming'}</Text>
            </View>
          </ImageBackground>
        ) : (
          <LinearGradient colors={gradients[item.grad]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.largeHero}>
            <Text style={styles.largeEmoji}>{item.emoji}</Text>
            <DateBadge day={day} month={month} />
            {onToggleSave && <SaveButton saved={saved} onPress={onToggleSave} large />}
            <LinearGradient colors={['#086E70', '#0F9B8E']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.heroBottom}>
              <Icon name="pricetag-outline" size={12} color="#fff" />
              <Text style={styles.heroCategory}>{item.category || 'Campus event'}</Text>
            </LinearGradient>
            <View style={[styles.eventStatus, statusStyle[0]]}>
              <Text style={[styles.eventStatusText, statusStyle[1]]}>{item.status || 'upcoming'}</Text>
            </View>
          </LinearGradient>
        )}
        <View style={styles.largeBody}>
          <View style={styles.largeTitleRow}>
            <Text style={styles.largeTitle} numberOfLines={2}>{item.title}</Text>
          </View>
          {!!item.desc && <Text style={styles.largeDescription} numberOfLines={2}>{item.desc}</Text>}
          <View style={styles.largeMetaRow}>
            <View style={styles.metaIconTime}><Icon name="time-outline" size={15} color="#B05D08" /></View>
            <Text style={styles.largeMetaText}>{item.time}</Text>
          </View>
          <View style={styles.largeMetaRow}>
            <View style={styles.metaIconLocation}><Icon name="location-outline" size={15} color="#087E80" /></View>
            <Text style={styles.largeMetaText} numberOfLines={1}>{item.venue || 'Venue to be announced'}</Text>
          </View>
          <View style={styles.largeFooter}>
            <View style={styles.organizerIcon}><Icon name="people-outline" size={15} color="#087E80" /></View>
            <Text style={styles.organizerText} numberOfLines={1}>{organizerLabel || 'University organizer'}</Text>
            {item.registrationRequired && (
              <LinearGradient colors={['#086E70', '#0F9B8E']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.registrationBadge}>
                <Text style={styles.registrationText}>Registration</Text>
              </LinearGradient>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={onPress}>
      {item.imageUrl ? (
        <ImageBackground source={{uri: item.imageUrl}} imageStyle={styles.dateImage} style={styles.date}>
          {compact ? <Text style={styles.emoji}>{item.emoji}</Text> : (
            <View style={styles.imageDate}>
              <Text style={styles.day}>{day}</Text>
              <Text style={styles.month}>{month}</Text>
            </View>
          )}
        </ImageBackground>
      ) : (
        <LinearGradient colors={gradients[item.grad]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.date}>
          {compact ? <Text style={styles.emoji}>{item.emoji}</Text> : <><Text style={styles.day}>{day}</Text><Text style={styles.month}>{month}</Text></>}
        </LinearGradient>
      )}
      <View style={styles.cardCopy}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.meta}>🕒 {item.time.split(' –')[0]}  ·  📍 {item.venue}</Text>
        <Text style={[styles.tag, item.status === 'cancelled' && styles.cancelled]}>{item.status === 'cancelled' ? 'Cancelled' : organizerLabel}</Text>
      </View>
      {onToggleSave && <SaveButton saved={saved} onPress={onToggleSave} />}
    </TouchableOpacity>
  );
}

function DateBadge({day, month}) {
  return (
    <LinearGradient colors={['#086E70', '#0F9B8E']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.dateBadge}>
      <Text style={styles.badgeDay}>{day}</Text>
      <Text style={styles.badgeMonth}>{month}</Text>
    </LinearGradient>
  );
}

function SaveButton({saved, onPress, large}) {
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={saved ? 'Remove saved event' : 'Save event'} onPress={event => { event.stopPropagation(); onPress(); }} style={[styles.heart, large && styles.largeHeart, saved && styles.heartOn]}>
      <Icon name={saved ? 'heart' : 'heart-outline'} size={18} color={saved ? '#FF5A3C' : large ? '#fff' : '#B5B9D3'} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 20, padding: 11, marginBottom: 11, ...shadow, shadowOpacity: 0.07},
  cardCopy: {flex: 1},
  date: {width: 62, height: 66, borderRadius: 16, alignItems: 'center', justifyContent: 'center'},
  largeCard: {backgroundColor: '#fff', borderRadius: 22, marginBottom: 16, overflow: 'hidden', ...shadow, shadowOpacity: 0.09},
  largeHero: {height: 156, width: '100%', alignItems: 'center', justifyContent: 'center'},
  largeImage: {borderTopLeftRadius: 22, borderTopRightRadius: 22},
  heroShade: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(18,20,43,0.18)'},
  largeEmoji: {fontSize: 54},
  dateBadge: {position: 'absolute', top: 12, left: 12, width: 50, height: 54, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.86)', alignItems: 'center', justifyContent: 'center', shadowColor: '#42356F', shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: {width: 0, height: 2}, elevation: 4},
  badgeDay: {fontSize: 20, fontWeight: '900', color: '#fff', lineHeight: 23},
  badgeMonth: {fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.9)', letterSpacing: 0.7, textTransform: 'uppercase'},
  heroBottom: {position: 'absolute', left: 12, bottom: 12, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5, shadowColor: '#302246', shadowOpacity: 0.2, shadowRadius: 5, shadowOffset: {width: 0, height: 2}, elevation: 3},
  heroCategory: {fontSize: 10.5, fontWeight: '900', color: '#fff', textTransform: 'capitalize', letterSpacing: 0.25},
  eventStatus: {position: 'absolute', right: 12, bottom: 12, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 5},
  eventStatusUpcoming: {backgroundColor: '#087E80'},
  eventStatusLive: {backgroundColor: '#087E80'},
  eventStatusCompleted: {backgroundColor: '#596174'},
  eventStatusCancelled: {backgroundColor: colors.danger},
  eventStatusText: {fontSize: 10, fontWeight: '900', color: '#fff', textTransform: 'capitalize', letterSpacing: 0.15},
  largeBody: {paddingHorizontal: 16, paddingTop: 13, paddingBottom: 14},
  largeTitleRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 8},
  largeTitle: {flex: 1, fontSize: 17, lineHeight: 22, fontWeight: '800', color: colors.ink},
  largeDescription: {fontSize: 12, lineHeight: 17, color: colors.mute, marginTop: 5, marginBottom: 4},
  largeMetaRow: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8},
  metaIconTime: {width: 27, height: 27, borderRadius: 9, backgroundColor: '#FFF3E4', alignItems: 'center', justifyContent: 'center'},
  metaIconLocation: {width: 27, height: 27, borderRadius: 9, backgroundColor: '#E8F8F6', alignItems: 'center', justifyContent: 'center'},
  largeMetaText: {flex: 1, fontSize: 12, fontWeight: '600', color: colors.ink},
  largeFooter: {flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10, marginTop: 12, gap: 7},
  organizerIcon: {width: 25, height: 25, borderRadius: 9, backgroundColor: '#E8F8F6', alignItems: 'center', justifyContent: 'center'},
  organizerText: {flex: 1, fontSize: 11, fontWeight: '700', color: colors.mute},
  registrationBadge: {flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 7, shadowColor: colors.primary, shadowOpacity: 0.26, shadowRadius: 7, shadowOffset: {width: 0, height: 3}, elevation: 4},
  registrationText: {fontSize: 9.5, fontWeight: '800', color: '#fff'},
  dateImage: {borderRadius: 16},
  imageDate: {alignItems: 'center', justifyContent: 'center', flex: 1, backgroundColor: 'rgba(22,24,44,0.38)', borderRadius: 16},
  day: {color: '#fff', fontSize: 22, fontWeight: '800'},
  month: {color: '#fff', fontSize: 10.5, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase'},
  emoji: {fontSize: 28},
  title: {fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: 3},
  meta: {fontSize: 12, color: colors.mute},
  tag: {alignSelf: 'flex-start', marginTop: 5, fontSize: 10.5, fontWeight: '700', color: '#087E80', backgroundColor: '#E8F8F6', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, overflow: 'hidden'},
  cancelled: {color: colors.danger, backgroundColor: '#FFF0EC'},
  heart: {width: 34, height: 34, borderRadius: 12, backgroundColor: '#F1F2FA', alignItems: 'center', justifyContent: 'center'},
  largeHeart: {position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(30,32,55,0.45)'},
  heartOn: {backgroundColor: '#FFE9E4'},
});
