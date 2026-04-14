export interface Attachment {
	id: string;
	name: string;
	type: "muzzle" | "barrel" | "grip" | "stock" | "magazine" | "sight" | "laser";
	icon?: string;
  }
  
  export interface Gun {
	id: string;
	name: string;
	type: "assault" | "smg" | "sniper" | "shotgun" | "pistol" | "lmg";
	description?: string;
	attachments: Attachment[];           // 当前已选择的配件
  }
  
  export type GunType = Gun["type"];