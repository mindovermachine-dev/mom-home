import getReadingTime from 'reading-time';
import { toString } from 'mdast-util-to-string';
import type { RehypePlugin, RemarkPlugin } from '@astrojs/markdown-remark';
import { visit } from 'unist-util-visit';

type ParagraphNode = {
  type: 'paragraph';
  children: Array<{ type?: string; value?: string }>;
  data?: {
    hProperties?: Record<string, unknown>;
  };
};

const KICKER_ATTRIBUTE_PATTERN = /\s*\{\s*\.kicker\s*\}\s*$/;

const isParagraphNode = (node: unknown): node is ParagraphNode => {
  return Boolean(node && typeof node === 'object' && (node as { type?: unknown }).type === 'paragraph');
};

export const remarkAttrClassPlugin: RemarkPlugin = () => {
  return function (tree) {
    visit(tree, (node) => {
      if (!isParagraphNode(node) || !Array.isArray(node.children) || node.children.length === 0) {
        return;
      }

      const lastChild = node.children[node.children.length - 1];
      if (!lastChild || lastChild.type !== 'text' || typeof lastChild.value !== 'string') {
        return;
      }

      const match = KICKER_ATTRIBUTE_PATTERN.exec(lastChild.value);
      if (!match) {
        return;
      }

      lastChild.value = lastChild.value.replace(KICKER_ATTRIBUTE_PATTERN, '');
      if (!lastChild.value.length) {
        node.children.pop();
      }

      node.data ??= {};
      const existingClasses = node.data.hProperties?.className;
      const classNames = Array.isArray(existingClasses)
        ? existingClasses
        : typeof existingClasses === 'string'
          ? [existingClasses]
          : [];

      node.data.hProperties = {
        ...(node.data.hProperties ?? {}),
        className: [...classNames, 'kicker'],
      };
    });
  };
};

export const readingTimeRemarkPlugin: RemarkPlugin = () => {
  return function (tree, file) {
    const textOnPage = toString(tree);
    const readingTime = Math.ceil(getReadingTime(textOnPage).minutes);

    if (typeof file?.data?.astro?.frontmatter !== 'undefined') {
      file.data.astro.frontmatter.readingTime = readingTime;
    }
  };
};

export const responsiveTablesRehypePlugin: RehypePlugin = () => {
  return function (tree) {
    if (!tree.children) return;

    for (let i = 0; i < tree.children.length; i++) {
      const child = tree.children[i];

      if (child.type === 'element' && child.tagName === 'table') {
        tree.children[i] = {
          type: 'element',
          tagName: 'div',
          properties: {
            style: 'overflow:auto',
          },
          children: [child],
        };

        i++;
      }
    }
  };
};
