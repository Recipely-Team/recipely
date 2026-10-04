import { StyleSheet, View } from 'react-native';
import type { DiaryTone } from '@presentation/base/theme/colors/tones/diary-tone';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { diarySizes, fontSizes, fontWeights, radii, spacing } from '@presentation/base/theme';
import { StatusMarker } from '@presentation/app/diary/shared/items/status-marker';
import type { StatusMarkerKindType } from '@presentation/app/diary/shared/model/status-marker-kind';
import { ValueConstants } from '@core/constants';

export interface StatusStripProps {
  tone: DiaryTone;
  marker: StatusMarkerKindType;
  message: string;
}

/** The summary's one-line verdict — "Within 10% of your goal", "269 kcal over your goal" — in the status tone with its marker. */
export const StatusStrip = ({ tone, marker, message }: StatusStripProps): React.JSX.Element => (
  <View style={[styles.strip, { backgroundColor: tone.bg }]} accessibilityRole="text">
    <StatusMarker kind={marker} color={tone.fg} size={diarySizes.markerStrip} />
    <SizedText size={fontSizes.caption} weight={fontWeights.bold} color={tone.fg} style={styles.text}>
      {message}
    </SizedText>
  </View>
);

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
  },
  text: { flex: ValueConstants.one },
});
