/**
 * Minimal ambient types for `react-test-renderer`, scoped to the surface the
 * presentation test helpers use. The package ships no types and the project
 * deliberately avoids adding `@types/react-test-renderer`, so this local
 * declaration keeps the renderer fully typed under `strict` mode.
 */
declare module 'react-test-renderer' {
  import type { ReactElement } from 'react';

  export interface ReactTestInstance {
    props: Record<string, unknown>;
    parent: ReactTestInstance | null;
    children: (ReactTestInstance | string)[];
    find(predicate: (instance: ReactTestInstance) => boolean): ReactTestInstance;
    /** `deep: false` stops at a match: a wrapper and the component it renders count once. */
    findAll(predicate: (instance: ReactTestInstance) => boolean, options?: { deep?: boolean }): ReactTestInstance[];
    findByType(type: unknown): ReactTestInstance;
    findAllByType(type: unknown): ReactTestInstance[];
  }

  export interface ReactTestRendererJSON {
    type: string;
    props: Record<string, unknown>;
    children: (ReactTestRendererJSON | string)[] | null;
  }

  export interface ReactTestRenderer {
    root: ReactTestInstance;
    toJSON(): ReactTestRendererJSON | ReactTestRendererJSON[] | null;
    update(element: ReactElement): void;
    unmount(): void;
  }

  export function create(element: ReactElement): ReactTestRenderer;
  export function act(callback: () => void | Promise<void>): Promise<undefined>;
  export function act(callback: () => void): void;
}
