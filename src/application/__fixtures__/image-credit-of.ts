import { ImageCredit } from '@domain/recipes/media/image-credit';

/** A valid Wikimedia-style cover credit, for tests about the credit line. */
export const imageCreditOf = (
  author = 'Jane Doe',
  license = 'CC-BY-4.0',
  url = 'https://commons.wikimedia.org/wiki/File:Menemen.jpg',
): ImageCredit => {
  const created = ImageCredit.create(author, license, url);
  if (!created.ok) throw new Error(created.failure.message);
  return created.value;
};
