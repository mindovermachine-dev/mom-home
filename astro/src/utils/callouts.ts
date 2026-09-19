import type { RemarkPlugin } from '@astrojs/markdown-remark';
import type { RootContent } from 'mdast';
import { visit } from 'unist-util-visit';

type DirectiveAttributes = Record<string, string | null | undefined>;

type DirectiveData = {
  directiveLabel?: boolean;
  hName?: string;
  hProperties?: Record<string, unknown>;
};

type ContainerDirectiveNode = {
  type: 'containerDirective';
  name?: string;
  label?: string;
  attributes?: DirectiveAttributes;
  data?: DirectiveData;
  children: RootContent[];
};

type ParagraphWithDirectiveLabel = RootContent & {
  type: 'paragraph';
  data?: { directiveLabel?: boolean };
  children: RootContent[];
};

const isContainerDirectiveNode = (node: unknown): node is ContainerDirectiveNode => {
  if (!node || typeof node !== 'object') {
    return false;
  }

  const candidate = node as { type?: unknown; children?: unknown };
  return candidate.type === 'containerDirective' && Array.isArray(candidate.children);
};

const isParagraphWithDirectiveLabel = (node: RootContent | undefined): node is ParagraphWithDirectiveLabel => {
  return Boolean(
    node &&
    node.type === 'paragraph' &&
    node.data &&
    typeof node.data === 'object' &&
    'directiveLabel' in node.data &&
    node.data.directiveLabel
  );
};

const CALLOUT_TITLES: Record<string, string> = {
  tip: 'Tip',
  note: 'Note',
  warning: 'Warning',
  caution: 'Caution',
  fact: 'Fact',
};

const sanitizeDirectiveValue = (value: string | null | undefined) => String(value ?? '').trim();
const FACT_POSITIONS = ['left', 'center', 'right'] as const;
const FACT_SIZES = ['small', 'medium', 'large', 'full'] as const;

const parseFactLabel = (label: string) => {
  const parts = label
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);
  let position = 'center';
  let size = 'medium';
  const titleParts: string[] = [];

  for (const part of parts) {
    const normalizedPart = part.toLowerCase();
    if (FACT_POSITIONS.includes(normalizedPart as (typeof FACT_POSITIONS)[number])) {
      position = normalizedPart;
    } else if (FACT_SIZES.includes(normalizedPart as (typeof FACT_SIZES)[number])) {
      size = normalizedPart;
    } else {
      titleParts.push(part);
    }
  }

  return { title: titleParts.join(' | '), position, size };
};

export const calloutDirectiveRemarkPlugin: RemarkPlugin = () => {
  return function (tree) {
    visit(tree, (node) => {
      if (!isContainerDirectiveNode(node)) {
        return;
      }

      const calloutType = String(node.name ?? '').toLowerCase();
      const isFactDirective = calloutType === 'fact';
      const titleFromLabel = sanitizeDirectiveValue(node.label);
      const labelParagraph = node.children?.[0];
      const titleFromDirectiveLabelParagraph = isParagraphWithDirectiveLabel(labelParagraph)
        ? String(
            labelParagraph.children.map((child) => (child.type === 'text' ? child.value : '')).join('') ?? ''
          ).trim()
        : '';
      const directiveLabel = titleFromLabel || titleFromDirectiveLabelParagraph;
      const titleFromAttribute = sanitizeDirectiveValue(node.attributes?.title);
      const titleFromLabelAttribute = sanitizeDirectiveValue(node.attributes?.label);
      const factLabel = isFactDirective ? parseFactLabel(directiveLabel) : undefined;
      const position = factLabel?.position || sanitizeDirectiveValue(node.attributes?.position) || 'center';
      const size = factLabel?.size || sanitizeDirectiveValue(node.attributes?.size) || 'medium';
      const calloutTitle =
        factLabel?.title ||
        directiveLabel ||
        titleFromDirectiveLabelParagraph ||
        titleFromAttribute ||
        titleFromLabelAttribute ||
        CALLOUT_TITLES[isFactDirective ? 'fact' : calloutType];

      // Remove directive label paragraph so it does not render again in body.
      if (titleFromDirectiveLabelParagraph) {
        node.children.shift();
      }

      if (!calloutTitle) {
        return;
      }

      const normalizedPosition = FACT_POSITIONS.includes(position as (typeof FACT_POSITIONS)[number])
        ? position
        : 'center';
      const normalizedSize = FACT_SIZES.includes(size as (typeof FACT_SIZES)[number]) ? size : 'medium';

      const bodyChildren = [...node.children];
      const titleNode: Extract<RootContent, { type: 'paragraph' }> = {
        type: 'paragraph',
        children: [{ type: 'text', value: calloutTitle }],
        data: {
          hProperties: {
            className: isFactDirective ? 'mom-fact__title' : undefined,
          },
        },
      } as Extract<RootContent, { type: 'paragraph' }>;

      node.data ??= {};
      node.data.hName = 'aside';
      node.data.hProperties = {
        className: isFactDirective
          ? [
              'callout',
              'callout--fact',
              'mom-fact',
              `mom-fact--position-${normalizedPosition}`,
              `mom-fact--size-${normalizedSize}`,
            ]
          : ['callout', `callout--${calloutType}`],
      };

      node.children = [titleNode, ...bodyChildren];
    });
  };
};
