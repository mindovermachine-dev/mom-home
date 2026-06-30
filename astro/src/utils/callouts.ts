import type { RemarkPlugin } from '@astrojs/markdown-remark';
import { visit } from 'unist-util-visit';

const CALLOUT_TITLES: Record<string, string> = {
  tip: 'Tip',
  note: 'Note',
  warning: 'Warning',
  caution: 'Caution',
};

export const calloutDirectiveRemarkPlugin: RemarkPlugin = () => {
  return function (tree) {
    visit(tree, 'containerDirective', (node: any) => {
      const calloutType = String(node.name ?? '').toLowerCase();
      const calloutTitle = String(node.label ?? '').trim() || CALLOUT_TITLES[calloutType];

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
