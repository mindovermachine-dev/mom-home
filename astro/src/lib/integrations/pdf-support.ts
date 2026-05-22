export interface PdfSupportConfig {
  enabled: boolean;
  browserExecutablePathEnvKeys: string[];
  outputPathTemplate: string;
}

export const defaultPdfSupportConfig: PdfSupportConfig = {
  // Intentionally off for MVP. Enable later when the PDF integration is installed.
  enabled: false,
  browserExecutablePathEnvKeys: ['PDF_BROWSER_PATH', 'PUPPETEER_EXECUTABLE_PATH'],
  outputPathTemplate: '/pdf[pathname].pdf',
};

export function getPdfSupportConfig(overrides: Partial<PdfSupportConfig> = {}): PdfSupportConfig {
  return {
    ...defaultPdfSupportConfig,
    ...overrides,
  };
}
