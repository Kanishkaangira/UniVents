import React, {useState} from 'react';
import {Alert, Image, Linking, Modal, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Pdf from 'react-native-pdf';
import BottomSheet from './BottomSheet';
import PrimaryButton from './PrimaryButton';
import {colors, gradients} from '../Constants/theme';
import {useApp} from '../Context/AppContext';

export default function NoticeDetailSheet({notice, visible, onClose}) {
  const [fullImage, setFullImage] = useState(false);
  const [pdfVisible, setPdfVisible] = useState(false);
  const [pdfPages, setPdfPages] = useState(0);
  const {departments, clubs} = useApp();
  if (!notice) return null;

  const isImageAttachment = notice.attachmentType === 'image' && !!notice.attachmentUrl;
  const posterUrl = isImageAttachment ? notice.attachmentUrl : notice.imageUrl;
  const department = notice.departmentId ? departments.find(item => item.id === notice.departmentId) : null;
  const club = notice.clubId ? clubs.find(item => item.id === notice.clubId) : null;
  const scopeValue = department ? `${department.name}${department.code ? ` (${department.code})` : ''}` : club?.name;
  const audience = notice.visibility === 'student' ? 'Students' : notice.visibility === 'faculty' ? 'Faculty' : 'Everyone';
  const downloadAttachment = async () => {
    try {
      const pathName = notice.attachmentUrl.split(/[?#]/, 1)[0].split('/').pop();
      const fallbackName = pathName ? decodeURIComponent(pathName) : notice.attachmentType === 'pdf' ? 'notice.pdf' : 'notice-image.jpg';
      const filename = notice.attachmentName || fallbackName;
      const separator = notice.attachmentUrl.includes('?') ? '&' : '?';
      await Linking.openURL(`${notice.attachmentUrl}${separator}download=${encodeURIComponent(filename)}`);
    } catch {
      Alert.alert('Unable to download attachment', 'Please try again or check your internet connection.');
    }
  };

  return (
    <>
      <BottomSheet visible={visible && !fullImage && !pdfVisible} onClose={onClose} maxHeight="94%">
        {posterUrl ? (
          <TouchableOpacity
            activeOpacity={isImageAttachment ? 0.95 : 1}
            accessibilityRole={isImageAttachment ? 'button' : undefined}
            accessibilityLabel={isImageAttachment ? 'View notice image full screen' : undefined}
            onPress={isImageAttachment ? () => setFullImage(true) : undefined}>
            <Image source={{uri: posterUrl}} style={[styles.poster, isImageAttachment && styles.documentImage]} resizeMode={isImageAttachment ? 'contain' : 'cover'} />
          </TouchableOpacity>
        ) : (
          <LinearGradient colors={gradients.brand} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={[styles.poster, styles.center]}>
            <Icon name="notifications-outline" size={34} color="#fff" />
          </LinearGradient>
        )}

        <View style={styles.heading}>
          <View style={styles.noticeIcon}><Icon name={notice.attachmentType === 'pdf' ? 'document-text-outline' : 'notifications-outline'} size={19} color={notice.attachmentType === 'pdf' ? '#B63847' : colors.primary} /></View>
          <View style={styles.headingCopy}>
            <Text style={styles.title}>{notice.title}</Text>
            <Text style={styles.meta}>{notice.source}  ·  {notice.date}</Text>
          </View>
        </View>

        {!!notice.tag && <Text style={styles.tag}>{notice.tag}</Text>}
        {!!notice.text && <Text style={styles.desc}>{notice.text}</Text>}

        <View style={styles.details}>
          {!!notice.source && <DetailRow icon="person-outline" label="Organizer" value={notice.source} />}
          {!!scopeValue && <DetailRow icon={department ? 'business-outline' : 'people-outline'} label={department ? 'Department' : 'Club'} value={scopeValue} />}
          <DetailRow icon="eye-outline" label="Visible to" value={audience} />
        </View>

        {!!notice.attachmentUrl && (
          <View style={styles.pdfCard}>
            <View style={[styles.pdfIcon, notice.attachmentType === 'image' && styles.imageFileIcon]}><Icon name={notice.attachmentType === 'pdf' ? 'document-text' : 'image'} size={23} color={notice.attachmentType === 'pdf' ? '#B63847' : '#087E80'} /></View>
            <View style={styles.fileCopy}>
              <Text style={styles.fileTitle} numberOfLines={2}>{notice.attachmentName || (notice.attachmentType === 'pdf' ? 'Notice document.pdf' : 'Notice image')}</Text>
              <Text style={styles.fileHint}>{notice.attachmentType === 'pdf' ? 'PDF document' : 'Image attachment'}</Text>
            </View>
            <View style={styles.attachmentActions}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={notice.attachmentType === 'pdf' ? 'View PDF in UniVents' : 'View image in UniVents'}
                onPress={notice.attachmentType === 'pdf' ? () => { setPdfPages(0); setPdfVisible(true); } : () => setFullImage(true)}
                style={styles.viewAction}>
                <Icon name="eye-outline" size={17} color="#fff" />
                <Text style={styles.actionText}>View in app</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Download ${notice.attachmentName || `notice ${notice.attachmentType}`}`}
                onPress={downloadAttachment}
                style={styles.downloadAction}>
                <Icon name="download-outline" size={17} color={notice.attachmentType === 'pdf' ? '#B63847' : '#087E80'} />
                <Text style={[styles.downloadText, notice.attachmentType === 'image' && styles.imageDownloadText]}>Download</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <PrimaryButton label="Close" variant="soft" onPress={onClose} />
      </BottomSheet>

      {isImageAttachment && (
        <Modal visible={fullImage} transparent={false} animationType="fade" statusBarTranslucent onRequestClose={() => setFullImage(false)}>
          <View style={styles.fullImageScreen}>
            <Image source={{uri: notice.attachmentUrl}} style={styles.fullImage} resizeMode="contain" />
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close full-screen notice image" onPress={() => setFullImage(false)} style={styles.closeImage}>
              <Icon name="close" size={23} color="#fff" />
            </TouchableOpacity>
          </View>
        </Modal>
      )}

      {notice.attachmentType === 'pdf' && !!notice.attachmentUrl && (
        <Modal visible={pdfVisible} animationType="slide" onRequestClose={() => setPdfVisible(false)}>
          <View style={styles.pdfViewer}>
            <View style={styles.pdfViewerHeader}>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close PDF viewer" onPress={() => setPdfVisible(false)} style={styles.pdfViewerClose}>
                <Icon name="close" size={22} color={colors.ink} />
              </TouchableOpacity>
              <View style={styles.pdfViewerTitleWrap}>
                <Text numberOfLines={1} style={styles.pdfViewerTitle}>{notice.attachmentName || notice.title}</Text>
                <Text style={styles.pdfViewerSub}>{pdfPages ? `${pdfPages} ${pdfPages === 1 ? 'page' : 'pages'}` : 'Notice document'}</Text>
              </View>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Download PDF" onPress={downloadAttachment} style={styles.pdfViewerDownload}>
                <Icon name="download-outline" size={20} color="#B63847" />
              </TouchableOpacity>
            </View>
            <Pdf
              source={{uri: notice.attachmentUrl, cache: true}}
              style={styles.pdfDocument}
              trustAllCerts={false}
              onLoadComplete={numberOfPages => setPdfPages(numberOfPages)}
              onError={() => Alert.alert('Unable to display PDF', 'Check that this file exists in Supabase Storage and try again.')}
            />
          </View>
        </Modal>
      )}
    </>
  );
}

function DetailRow({icon, label, value}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}><Icon name={icon} size={16} color="#087E80" /></View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  poster: {height: 160, width: '100%', borderRadius: 20, marginBottom: 15, backgroundColor: '#F2F4F8'},
  documentImage: {height: 280, backgroundColor: '#F5F6FA'},
  center: {alignItems: 'center', justifyContent: 'center'},
  heading: {flexDirection: 'row', alignItems: 'flex-start', gap: 11, marginBottom: 12},
  noticeIcon: {width: 40, height: 40, borderRadius: 13, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center'},
  headingCopy: {flex: 1},
  title: {fontSize: 20, lineHeight: 26, fontWeight: '900', color: colors.ink},
  meta: {fontSize: 11.5, fontWeight: '600', color: colors.mute, marginTop: 5},
  tag: {alignSelf: 'flex-start', fontSize: 10.5, fontWeight: '800', color: colors.primary, backgroundColor: colors.soft, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, overflow: 'hidden'},
  desc: {fontSize: 14, lineHeight: 22, color: colors.ink, marginTop: 14, marginBottom: 16},
  details: {backgroundColor: '#F8F9FC', borderWidth: 1, borderColor: colors.line, borderRadius: 16, paddingHorizontal: 12, marginBottom: 14},
  detailRow: {minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 9, borderBottomWidth: 1, borderBottomColor: '#E9EBF2'},
  detailIcon: {width: 28, height: 28, borderRadius: 9, backgroundColor: '#E8F8F6', alignItems: 'center', justifyContent: 'center'},
  detailLabel: {width: 74, fontSize: 11, fontWeight: '700', color: colors.mute},
  detailValue: {flex: 1, fontSize: 12, fontWeight: '800', color: colors.ink, textAlign: 'right'},
  pdfCard: {flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, backgroundColor: '#FFF8F8', borderWidth: 1, borderColor: '#F0DADB', borderRadius: 18, padding: 12, marginTop: 6, marginBottom: 16},
  pdfIcon: {width: 43, height: 43, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FCEAEC'},
  imageFileIcon: {backgroundColor: '#E8F8F6'},
  fileCopy: {flex: 1, minWidth: 130},
  fileTitle: {fontSize: 12.5, fontWeight: '800', color: colors.ink},
  fileHint: {fontSize: 10.5, lineHeight: 15, color: colors.mute, marginTop: 3},
  attachmentActions: {width: '100%', flexDirection: 'row', gap: 8, marginTop: 3},
  viewAction: {flex: 1, minHeight: 42, borderRadius: 12, backgroundColor: '#087E80', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7},
  downloadAction: {flex: 1, minHeight: 42, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E7C8CB', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7},
  actionText: {fontSize: 12, fontWeight: '800', color: '#fff'},
  downloadText: {fontSize: 12, fontWeight: '800', color: '#B63847'},
  imageDownloadText: {color: '#087E80'},
  fullImageScreen: {flex: 1, backgroundColor: '#080911', justifyContent: 'center', alignItems: 'center'},
  fullImage: {width: '100%', height: '100%'},
  closeImage: {position: 'absolute', top: 44, right: 18, width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(35,37,54,0.75)'},
  pdfViewer: {flex: 1, backgroundColor: '#E9ECF2'},
  pdfViewerHeader: {minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#fff', paddingHorizontal: 14, paddingTop: 8, borderBottomWidth: 1, borderBottomColor: colors.line},
  pdfViewerClose: {width: 40, height: 40, borderRadius: 13, backgroundColor: '#F1F3F8', alignItems: 'center', justifyContent: 'center'},
  pdfViewerTitleWrap: {flex: 1},
  pdfViewerTitle: {fontSize: 13, fontWeight: '800', color: colors.ink},
  pdfViewerSub: {fontSize: 10.5, color: colors.mute, marginTop: 3},
  pdfViewerDownload: {width: 40, height: 40, borderRadius: 13, backgroundColor: '#FFF0F1', alignItems: 'center', justifyContent: 'center'},
  pdfDocument: {flex: 1, width: '100%', backgroundColor: '#E9ECF2'},
});
