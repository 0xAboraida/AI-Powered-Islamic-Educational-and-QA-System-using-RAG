/**
 * collectionsData.ts
 * ------------------
 * Metadata and definitions for the 12 Islamic collections partitioned across clusters.
 */

import { CollectionItem } from './types';

export const TURATH_COLLECTIONS: CollectionItem[] = [
  {
    id: 'c1_zad_fiqh_hanbali_1',
    name: 'c1_zad_fiqh_hanbali_1',
    arabicName: 'الفقه الحنبلي',
    clusterId: 'cluster_1',
    icon: 'Scale',
    description: 'موسوعات وكتب الفقه الحنبلي المعتمدة (المغني، الروض المربع، وغيرها)'
  },
  {
    id: 'zad_turath_fiqh_hanbali',
    name: 'zad_turath_fiqh_hanbali',
    arabicName: 'الفقه الحنبلي',
    clusterId: 'cluster_1',
    icon: 'BookOpen',
    description: 'أمهات كتب الحنابلة (المغني، الروض المربع، كشاف القناع، الفروع)'
  },
  {
    id: 'zad_turath_fiqh_hanafi',
    name: 'zad_turath_fiqh_hanafi',
    arabicName: 'الفقه الحنفي',
    clusterId: 'cluster_1',
    icon: 'BookOpen',
    description: 'معتمد كتب الحنفية (المبسوط، بدائع الصنائع، حاشية ابن عابدين)'
  },
  {
    id: 'zad_turath_fiqh_aam',
    name: 'zad_turath_fiqh_aam',
    arabicName: 'الفقه العام والمقارن',
    clusterId: 'cluster_1',
    icon: 'Scale',
    description: 'كتب أصول الفقه، القواعد الفقهية، والفقه المقارن بدون تحيز لمذهب'
  },
  {
    id: 'zad_turath_aqeedah',
    name: 'zad_turath_aqeedah',
    arabicName: 'العقيدة وأصول الدين',
    clusterId: 'cluster_1',
    icon: 'Shield',
    description: 'كتب التوحيد، الإيمان، العقيدة الواسطية، والرد على الفرق'
  },
  {
    id: 'zad_turath_general',
    name: 'zad_turath_general',
    arabicName: 'معارف ومصنفات عامة',
    clusterId: 'cluster_1',
    icon: 'Folder',
    description: 'الفهارس العامة، الكشافات، والمصنفات المتنوعة'
  },
  {
    id: 'zad_turath_fiqh_shafii',
    name: 'zad_turath_fiqh_shafii',
    arabicName: 'الفقه الشافعي',
    clusterId: 'cluster_2',
    icon: 'BookOpen',
    description: 'معتمد كتب الشافعية (الأم، المجموع للنووي، منهاج الطالبين)'
  },
  {
    id: 'zad_turath_fiqh_maliki',
    name: 'zad_turath_fiqh_maliki',
    arabicName: 'الفقه المالكي',
    clusterId: 'cluster_2',
    icon: 'Scroll',
    description: 'معتمد كتب المالكية (المدونة، بداية المجتهد، مختصر خليل)'
  },
  {
    id: 'zad_turath_tafseer',
    name: 'zad_turath_tafseer',
    arabicName: 'التفسير وعلوم القرآن',
    clusterId: 'cluster_2',
    icon: 'Sparkles',
    description: 'تفسير الطبري، ابن كثير، القرطبي، وعلوم التنزيل والقراءات'
  },
  {
    id: 'zad_turath_hadith',
    name: 'zad_turath_hadith',
    arabicName: 'الحديث والشروح النبوية',
    clusterId: 'cluster_2',
    icon: 'Bookmark',
    description: 'الصحاح والسنن، فتح الباري، شرح النووي على مسلم، وكتب العلل'
  },
  {
    id: 'zad_turath_seerah',
    name: 'zad_turath_seerah',
    arabicName: 'السيرة والشمائل المحمدية',
    clusterId: 'cluster_2',
    icon: 'Compass',
    description: 'سيرة ابن هشام، زاد المعاد، الشمائل المحمدية، والمغازي'
  },
  {
    id: 'zad_turath_tarikh',
    name: 'zad_turath_tarikh',
    arabicName: 'التاريخ والتراجم والطبقات',
    clusterId: 'cluster_2',
    icon: 'Layers',
    description: 'سير أعلام النبلاء، البداية والنهاية، وتاريخ الطبري'
  },
  {
    id: 'zad_turath_lugha',
    name: 'zad_turath_lugha',
    arabicName: 'علوم اللغة والنحو والبلاغة',
    clusterId: 'cluster_2',
    icon: 'BookOpen',
    description: 'لسان العرب، الآجرومية، ألفية ابن مالك، ودلائل الإعجاز'
  }
];

export const getCollectionDetails = (name: string, customMeta?: Record<string, any>): CollectionItem => {
  if (customMeta && customMeta[name]) {
    const meta = customMeta[name];
    return {
      id: name,
      name: name,
      arabicName: meta.arabic_name || name,
      clusterId: meta.cluster_id || 'cluster_1',
      icon: meta.icon || 'BookOpen',
      description: meta.description || ''
    };
  }
  const found = TURATH_COLLECTIONS.find(c => c.name === name || c.id === name);
  if (found) return found;

  return {
    id: name,
    name: name,
    arabicName: name,
    clusterId: 'cluster_1',
    icon: 'Folder',
    description: ''
  };
};

export const COMMON_TURATH_CATEGORIES: string[] = [
  'الفقه الحنبلي',
  'الفقه الشافعي',
  'الفقه المالكي',
  'الفقه الحنفي',
  'الفقه العام',
  'أصول الفقه والقواعد الفقهية',
  'العقيدة وأصول الدين',
  'التفسير وعلوم القرآن',
  'الحديث النبوي وشروحه',
  'السيرة والشمائل المحمدية',
  'التاريخ والتراجم والطبقات',
  'علوم اللغة والنحو والمعاجم',
  'الزهد والرقائق والآداب',
  'الفتاوى والبحوث الفقهية'
];
