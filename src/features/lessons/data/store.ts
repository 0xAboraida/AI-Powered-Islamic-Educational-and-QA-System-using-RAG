import { Scholar, ExplanationSeries } from './mockData';

export const getScholars = (): Scholar[] => {
  const data = localStorage.getItem('zad_scholars');
  let scholars: Scholar[] = [];
  if (data) {
    try {
      scholars = JSON.parse(data);
    } catch {
      scholars = [];
    }
  }

  // Filter out any mock dummy scholars (IDs like sch_001, avatars with ui-avatars.com, etc.)
  const cleanScholars = scholars.filter(
    s => s.id && !s.id.startsWith('sch_') && !s.avatar?.includes('ui-avatars.com')
  );

  if (cleanScholars.length !== scholars.length) {
    localStorage.setItem('zad_scholars', JSON.stringify(cleanScholars));
  }

  return cleanScholars;
};

export const getSeries = (): ExplanationSeries[] => {
  const data = localStorage.getItem('zad_series');
  let seriesList: ExplanationSeries[] = [];
  if (data) {
    try {
      seriesList = JSON.parse(data);
    } catch {
      seriesList = [];
    }
  }

  // Filter out any mock dummy series (IDs like pl_001, thumbnails with placeholder, etc.)
  const cleanSeries = seriesList.filter(
    s => s.id && !s.id.startsWith('pl_') && !s.thumbnail?.includes('placeholder')
  );

  if (cleanSeries.length !== seriesList.length) {
    localStorage.setItem('zad_series', JSON.stringify(cleanSeries));
  }

  return cleanSeries;
};

export const addScholar = (scholar: Scholar) => {
  const scholars = getScholars();
  const existingIndex = scholars.findIndex(s => s.id === scholar.id);
  if (existingIndex >= 0) {
    scholars[existingIndex] = { ...scholars[existingIndex], ...scholar };
  } else {
    scholars.push(scholar);
  }
  localStorage.setItem('zad_scholars', JSON.stringify(scholars));
};

export const addSeriesToStore = (newSeries: ExplanationSeries) => {
  const current = getSeries();
  const existingIndex = current.findIndex(x => x.id === newSeries.id);
  if (existingIndex >= 0) {
    current[existingIndex] = { ...current[existingIndex], ...newSeries };
  } else {
    current.push(newSeries);
  }
  localStorage.setItem('zad_series', JSON.stringify(current));
};

export const deleteSeriesFromStore = (seriesId: string) => {
  const current = getSeries();
  const filtered = current.filter(x => x.id !== seriesId);
  localStorage.setItem('zad_series', JSON.stringify(filtered));
  return filtered;
};

export const deleteScholarFromStore = (scholarId: string, deleteItsSeries: boolean = false) => {
  const scholars = getScholars().filter(s => s.id !== scholarId);
  localStorage.setItem('zad_scholars', JSON.stringify(scholars));
  
  if (deleteItsSeries) {
    const series = getSeries().filter(s => s.scholarId !== scholarId);
    localStorage.setItem('zad_series', JSON.stringify(series));
  }
  return scholars;
};

export const mergeScholarsInStore = (sourceScholarId: string, targetScholarId: string) => {
  // 1. Move all series from source to target
  const series = getSeries().map(s => {
    if (s.scholarId === sourceScholarId) {
      return { ...s, scholarId: targetScholarId };
    }
    return s;
  });
  localStorage.setItem('zad_series', JSON.stringify(series));

  // 2. Remove source scholar
  const scholars = getScholars().filter(s => s.id !== sourceScholarId);
  localStorage.setItem('zad_scholars', JSON.stringify(scholars));
  return scholars;
};


