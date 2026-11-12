import { BookTrackDefinition, TrackRecordingItem } from '../types';
import { getStoredBookTracks } from './trackStorage';

/**
 * المسارات الافتراضية المدمجة في المنصة.
 * أي تعديلات أو مسارات إضافية ينشئها الأدمن من لوحة التحكم تُحفظ وتُدمج تلقائيًا عبر trackStorage.ts.
 */
export const DEFAULT_BOOK_TRACKS: BookTrackDefinition[] = [
  {
    id: 'umdat-al-fiqh-reda-thabet',
    title: 'مسار مدارسة كتاب عمدة الفقه',
    subtitle: 'دراسة تأصيلية في الفقه الحنبلي بشرح فضيلة الشيخ رضا ثابت',
    bookTitle: 'عمدة الفقه',
    author: 'الإمام موفق الدين ابن قدامة المقدسي',
    commentator: 'الشيخ رضا ثابت',
    domain: 'الفقه',
    madhhab: 'حنبلي',
    turathId: 11315,
    description:
      'مسار منظم لمدارسة متن «عمدة الفقه» لابن قدامة، يجمع بين قراءة المتن من المكتبة التراثية والاستماع لشروح الشيخ رضا ثابت، مع عرض الفهرس كاملًا وربط التسجيلات بأبوابها المحددة.',
    telegramChannelUrl: 'https://t.me/sh_redaa_thabet',
    telegramStartUrl: 'https://t.me/sh_redaa_thabet/406',
    bookPdfTelegramUrl: 'https://t.me/sh_redaa_thabet/407',
    recordingsMappingStrategy: 'hybrid',
    generalRecordings: [
      {
        id: 'umdat-rec-intro-post',
        title: 'الإعلان ومنهج شرح كتاب عمدة الفقه',
        type: 'audio',
        lectureNumber: 0,
        telegramUrl: 'https://t.me/sh_redaa_thabet/406',
        notes: 'البداية التعريفية بسلسلة شرح كتاب عمدة الفقه المكتمل على القناة',
      },
      {
        id: 'umdat-rec-001',
        title: 'مادة الفقه (المقدمة)',
        type: 'audio',
        lectureNumber: 1,
        duration: '32:09',
        telegramUrl: 'https://t.me/sh_redaa_thabet/408',
        notes: 'المقدمة المنهجية لمدارسة متن عمدة الفقه',
      },
      {
        id: 'umdat-rec-002',
        title: 'الدرس الأول — بداية المتن',
        type: 'audio',
        lectureNumber: 2,
        duration: '18:42',
        telegramUrl: 'https://t.me/sh_redaa_thabet/409',
        notes: 'الشرح الأول على متن عمدة الفقه',
      },
    ],
    sections: [],
    bindings: [],
  },
];

export const BOOK_TRACKS = DEFAULT_BOOK_TRACKS;

export function getBookTrackById(
  trackId?: string | null,
  sourceTracks?: BookTrackDefinition[]
): BookTrackDefinition | null {
  if (!trackId) return null;
  const list = sourceTracks ?? getStoredBookTracks();
  return list.find((track) => track.id === trackId) ?? null;
}

export function getAllTrackRecordings(track: BookTrackDefinition): TrackRecordingItem[] {
  const seen = new Set<string>();
  const all: TrackRecordingItem[] = [];

  const pushUnique = (items?: TrackRecordingItem[]) => {
    for (const item of items ?? []) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        all.push(item);
      }
    }
  };

  pushUnique(track.generalRecordings);
  for (const binding of track.bindings ?? []) {
    pushUnique(binding.recordings);
  }
  for (const section of track.sections ?? []) {
    pushUnique(section.recordings);
  }

  return all;
}
