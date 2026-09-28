/**
 * The picked pages: added in the order picked, capped at five photos or one
 * PDF, removable, and reorderable — the order is the order the pages are read.
 */

import { act } from 'react-test-renderer';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useFilePages } from '@presentation/app/import-recipe/hooks/file/use-file-pages';
import { ErrorMessageKey } from '@core/failure';
import type { ImportFile } from '@domain/recipes/import-file/import-file';
import { ImportFileMimeType } from '@domain/recipes/import-file/import-file-mime-type';

type ViewModel = ReturnType<typeof useFilePages>;

const photo = (name: string): ImportFile => ({
  uri: `file:///${name}`,
  fileName: name,
  mimeType: ImportFileMimeType.Jpeg,
  sizeBytes: null,
});
const pdf: ImportFile = { uri: 'file:///r.pdf', fileName: 'r.pdf', mimeType: ImportFileMimeType.Pdf, sizeBytes: 10 };

const drive = (): (() => ViewModel) => {
  let latest!: ViewModel;
  const Probe = (): null => {
    latest = useFilePages();
    return null;
  };
  renderComponent(<Probe />);
  return () => latest;
};
const names = (vm: ViewModel): string[] => vm.pages.map((page) => page.file.fileName);

describe('useFilePages', () => {
  it('adds pages in the order they were picked, each with its own key', () => {
    const vm = drive();
    act(() => vm().add([photo('1.jpg'), photo('2.jpg')]));
    act(() => vm().add([photo('3.jpg')]));

    expect(names(vm())).toEqual(['1.jpg', '2.jpg', '3.jpg']);
    expect(new Set(vm().pages.map((page) => page.key)).size).toBe(3);
    expect(vm().failure).toBeNull();
  });

  it('stops at five photos, keeps the first five and says why', () => {
    const vm = drive();
    act(() => vm().add(['1', '2', '3', '4', '5', '6', '7'].map((n) => photo(`${n}.jpg`))));

    expect(names(vm())).toEqual(['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg']);
    expect(vm().isFull).toBe(true);
    expect(vm().failure?.messageKey).toBe(ErrorMessageKey.importTooManyFiles);
  });

  it('treats one PDF as a full batch that photos cannot join', () => {
    const vm = drive();
    act(() => vm().add([pdf]));
    act(() => vm().add([photo('1.jpg')]));

    expect(names(vm())).toEqual(['r.pdf']);
    expect(vm().isPdf).toBe(true);
    expect(vm().isFull).toBe(true);
    expect(vm().failure?.messageKey).toBe(ErrorMessageKey.importTooManyFiles);
  });

  it('removes a page and clears the complaint about the batch', () => {
    const vm = drive();
    act(() => vm().add(['1', '2', '3', '4', '5', '6'].map((n) => photo(`${n}.jpg`))));
    act(() => vm().remove(1));

    expect(names(vm())).toEqual(['1.jpg', '3.jpg', '4.jpg', '5.jpg']);
    expect(vm().isFull).toBe(false);
    expect(vm().failure).toBeNull();
  });

  it('moves a page, keeping its key, and ignores a move off either end', () => {
    const vm = drive();
    act(() => vm().add([photo('1.jpg'), photo('2.jpg'), photo('3.jpg')]));
    const firstKey = vm().pages[0].key;

    act(() => vm().move(0, 2));
    expect(names(vm())).toEqual(['2.jpg', '3.jpg', '1.jpg']);
    expect(vm().pages[2].key).toBe(firstKey);

    act(() => vm().move(0, -1));
    act(() => vm().move(2, 3));
    expect(names(vm())).toEqual(['2.jpg', '3.jpg', '1.jpg']);
  });
});
