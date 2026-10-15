export interface OwnerLoadoutInput {
  weaponId: string;
  code: string;
  title: string;
  notes: string;
  tags: string[];
  game: string;
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
  updatedAt: string;
}
