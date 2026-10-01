import { CreatorSummaryEntity } from '@domain/creators/creator-summary-entity';
import { CreatorTag } from '@domain/creators/creator-tag';

/** An approved Instagram creator with the given id — all a grid test needs. */
export const creatorSummaryOf = (id: string): CreatorSummaryEntity => {
  const tag = CreatorTag.create('instagram', `chef_${id}`);
  if (!tag.ok) throw new Error('fixture creator tag invalid');
  const summary = CreatorSummaryEntity.create({
    id,
    displayName: `Creator ${id}`,
    photoUrl: null,
    creatorTags: [tag.value],
    recipeCount: 1,
    followerCount: 0,
  });
  if (!summary.ok) throw new Error('fixture creator summary invalid');
  return summary.value;
};
