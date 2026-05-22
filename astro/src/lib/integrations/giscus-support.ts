export interface GiscusSupportConfig {
  enabled: boolean;
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  mapping: 'pathname' | 'url' | 'title' | 'og:title';
  strict: '0' | '1';
  reactionsEnabled: '0' | '1';
  inputPosition: 'top' | 'bottom';
  theme: string;
}

export const defaultGiscusSupportConfig: GiscusSupportConfig = {
  // Intentionally off for MVP. Enable later when comments are needed.
  enabled: false,
  repo: 'mindovermachine-dev/giscus-public',
  repoId: 'R_kgDOSOq5OQ',
  category: 'docs.mindovermachine.dk',
  categoryId: 'DIC_kwDOSOq5Oc4C73LV',
  mapping: 'pathname',
  strict: '0',
  reactionsEnabled: '1',
  inputPosition: 'bottom',
  theme: 'preferred_color_scheme',
};

export function getGiscusSupportConfig(overrides: Partial<GiscusSupportConfig> = {}): GiscusSupportConfig {
  return {
    ...defaultGiscusSupportConfig,
    ...overrides,
  };
}

export function getGiscusLanguage(pathname: string): 'da' | 'en' {
  return pathname.startsWith('/da/') ? 'da' : 'en';
}
