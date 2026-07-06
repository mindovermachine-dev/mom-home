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
};

export const calloutDirectiveRemarkPlugin: RemarkPlugin = () => {
  return function (tree) {
    visit(tree, (node) => {
      if (!isContainerDirectiveNode(node)) {
        return;
      }

      const calloutType = String(node.name ?? '').toLowerCase();
      const titleFromLabel = String(node.label ?? '').trim();
      const labelParagraph = node.children?.[0];
      const titleFromDirectiveLabelParagraph = isParagraphWithDirectiveLabel(labelParagraph)
        ? String(
            labelParagraph.children.map((child) => (child.type === 'text' ? child.value : '')).join('') ?? ''
          ).trim()
        : '';
      const titleFromAttribute = String(node.attributes?.title ?? '').trim();
      const titleFromLabelAttribute = String(node.attributes?.label ?? '').trim();
      const calloutTitle =
        titleFromLabel ||
        titleFromDirectiveLabelParagraph ||
        titleFromAttribute ||
        titleFromLabelAttribute ||
        CALLOUT_TITLES[calloutType];

      // Remove directive label paragraph so it does not render again in body.
      if (titleFromDirectiveLabelParagraph) {
        node.children.shift();
      }

      if (!calloutTitle) {
        return;
      }

      node.data ??= {};
      node.data.hName = 'aside';
      node.data.hProperties = {
        className: ['callout', `callout--${calloutType}`],
      };

      node.children.unshift({
        type: 'paragraph',
        children: [
          {
            type: 'strong',
            children: [{ type: 'text', value: calloutTitle }],
          },
        ],
      });
    });
  };
};
