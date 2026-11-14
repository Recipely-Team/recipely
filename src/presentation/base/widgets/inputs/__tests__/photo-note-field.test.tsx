import { TextInput } from 'react-native';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { PhotoNoteField } from '@presentation/base/widgets/inputs/photo-note-field';
import { PHOTO_NOTE_MAX_CHARS } from '@domain/common/photo-note';
import { controlSizes } from '@presentation/base/theme';

/** The note under photos sent to the AI: the field stops at the backend's limit and says so. */
describe('PhotoNoteField', () => {
  it('stops typing at the limit and counts what is there', () => {
    const { root } = renderComponent(
      <PhotoNoteField value="top shelf" onChangeText={jest.fn()} placeholder="e.g." editable />,
    );
    const input = root.findByType(TextInput);
    expect(input.props['maxLength']).toBe(PHOTO_NOTE_MAX_CHARS);
    expect(input.props['editable']).toBe(true);
    expect(textContent(root)).toContain(`9/${PHOTO_NOTE_MAX_CHARS}`);
  });

  it('is read-only while the photos are being sent', () => {
    const { root } = renderComponent(<PhotoNoteField value="" onChangeText={jest.fn()} placeholder="e.g." editable={false} />);
    expect(root.findByType(TextInput).props['editable']).toBe(false);
  });

  it('rests at the note height and passes typing up', () => {
    const onChangeText = jest.fn();
    const { root } = renderComponent(<PhotoNoteField value="" onChangeText={onChangeText} placeholder="e.g." editable />);
    const input = root.findByType(TextInput);
    (input.props['onChangeText'] as (next: string) => void)('only page two');
    expect(onChangeText).toHaveBeenCalledWith('only page two');
    expect(JSON.stringify(input.props['style'])).toContain(String(controlSizes.photoNoteField));
  });
});
