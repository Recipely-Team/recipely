import { Children, isValidElement, type ReactNode } from 'react';
import { CharConstants, ValueConstants } from '@core/constants';
import { isString } from '@core/guards/type-guards';

/** Deep enough for a label inside an icon row inside a button, not a whole subtree. */
const MAX_DEPTH = 4;

/**
 * The words a piece of JSX shows, for a control that has no accessibility label.
 *
 * @remarks
 * - **`shouldReadNested` false reads only the node's own strings**: a `ThemedText` nested in
 *   another registers itself, and reading it twice would say it twice.
 */
export const textOfChildren = (children: ReactNode, shouldReadNested: boolean, depth: number = ValueConstants.zero): string => {
  const parts: string[] = [];
  Children.forEach(children, (child) => {
    if (isString(child)) parts.push(child);
    else if (typeof child === 'number') parts.push(String(child));
    else if (shouldReadNested && depth < MAX_DEPTH && isValidElement<{ children?: ReactNode }>(child)) {
      parts.push(textOfChildren(child.props.children, shouldReadNested, depth + ValueConstants.one));
    }
  });
  return parts.join(CharConstants.space).trim();
};
