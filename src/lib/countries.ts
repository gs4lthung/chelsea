/**
 * Curated list of national flags already bundled in /static, for the
 * player edit form's country picker. Custom flags (for a country not
 * listed here) can still be uploaded and are stored as a data: URL.
 */

export interface CountryOption {
  name: string;
  flag: string;
}

export const COUNTRIES: CountryOption[] = [
  { name: 'Argentina', flag: '/argentina.webp' },
  { name: 'Belgium', flag: '/belgium.png' },
  { name: 'Brazil', flag: '/brazil.png' },
  { name: 'Denmark', flag: '/denmark.webp' },
  { name: 'Ecuador', flag: '/ecuador.png' },
  { name: 'England', flag: '/england.png' },
  { name: 'France', flag: '/france.webp' },
  { name: 'Italy', flag: '/italy.png' },
  { name: 'Netherlands', flag: '/netherlands.webp' },
  { name: 'Portugal', flag: '/portugal.webp' },
  { name: 'Senegal', flag: '/senegal.png' },
  { name: 'Spain', flag: '/spain.webp' },
  { name: 'Ukraine', flag: '/ukraina.png' },
  { name: 'USA', flag: '/usa.png' },
].sort((a, b) => a.name.localeCompare(b.name));
