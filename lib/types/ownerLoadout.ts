export interface OwnerLoadoutInput {
  weaponId: string;
  code: string;
  title: string;
  notes: string;
  tags: string[];
  game: string;
  focusTags: string[];
  recommendation: number;
  rankPosition: number | null;
  season: string;
  postedAt: string;
}

export interface OwnerLoadout {
  id: number;
  weaponId: string;
  weaponName: string;
  code: string;
  title: string;
  notes: string;
  tags: string[];
  game: string;
  focusTags: string[];
  recommendation: number;
  rankPosition: number | null;
  season: string;
  postedAt: string;
  updatedAt: string;
}
