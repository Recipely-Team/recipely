import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing } from '@presentation/base/theme';
import { PickSource } from '@presentation/base/utils/pick-source';
import { t } from '@presentation/i18n';
import { FileOptionRow } from '@presentation/app/import-recipe/items/file-option-row';

export interface FileSourceOptionsProps {
  onPick: (source: PickSource) => void;
}

/**
 * The phone's empty state: the camera, the library, or a PDF from the
 * device's files — the three rows the design draws.
 */
export const FileSourceOptions = ({ onPick }: FileSourceOptionsProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().fileImport;

  return (
    <View style={styles.list}>
      <FileOptionRow
        icon="camera-outline"
        label={copy.camera}
        hint={copy.cameraHint}
        onPress={() => onPick(PickSource.Camera)}
      />
      <FileOptionRow
        icon="image-outline"
        label={copy.library}
        hint={copy.libraryHint}
        onPress={() => onPick(PickSource.Library)}
      />
      <FileOptionRow
        icon="document-outline"
        label={copy.pdf}
        hint={copy.pdfHint}
        onPress={() => onPick(PickSource.File)}
      />
      <ThemedText variant="caption" style={[styles.formats, { color: colors.textMuted }]}>
        {copy.formats}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm2,
  },
  formats: {
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
