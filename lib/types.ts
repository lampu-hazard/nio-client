export type ApiResponse<T> = { ok: true } & T;

export type GuildSummary = {
  id: string;
  name: string;
  icon?: string | null;
  iconUrl?: string | null;
  botInGuild: boolean;
  inviteUrl: string;
};

export type PanelRole = {
  id: string;
  roleId: string;
  emoji?: string | null;
  label: string;
  description?: string | null;
  buttonStyle: 'PRIMARY' | 'SECONDARY' | 'SUCCESS' | 'DANGER';
  position: number;
};

export type Panel = {
  id: string;
  guildId: string;
  channelId?: string | null;
  messageId?: string | null;
  name: string;
  title: string;
  accentText?: string | null;
  description?: string | null;
  type: 'SELF_ROLE' | 'RULES' | 'ANNOUNCEMENT';
  mode: 'BUTTONS' | 'MENU';
  style: 'PREMIUM' | 'MINIMAL' | 'COLORFUL' | 'NEON';
  color: string;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  maxRoles: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  lastPublishedAt?: string | null;
  roles: PanelRole[];
};
