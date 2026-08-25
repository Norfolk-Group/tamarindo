/** Widescreen print page for live financial reports. 16:9, theme tokens. */

export const REPORT_PAGE = {
  ratio: "16:9",
  widthIn: 13.333,
  heightIn: 7.5,
} as const;

export function reportPageCssSize(): string {
  return `${REPORT_PAGE.widthIn}in ${REPORT_PAGE.heightIn}in`;
}

export function reportPdfBox() {
  return {
    width: `${REPORT_PAGE.widthIn}in`,
    height: `${REPORT_PAGE.heightIn}in`,
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: true,
    margin: {
      top: "52px",
      bottom: "52px",
      left: "28px",
      right: "28px",
    },
  } as const;
}
