import { StyleSheet, View } from 'react-native';
import { CreatorPlatform } from '@domain/creators/creator-platform';
import { ValueConstants } from '@core/constants';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { CreatorPlatformMark } from '@presentation/base/widgets/creators/creator-platform-mark';
import { creatorMarkGeometry } from '@presentation/base/widgets/creators/creator-mark-geometry';
import { creatorPlatformName } from '@presentation/base/widgets/creators/creator-platform-name';
import { InstagramConnectBlock } from '@presentation/base/widgets/instagram/instagram-connect-block';
import type { InstagramConnectPhaseType } from '@presentation/base/widgets/instagram/instagram-connect-phase';
import { fontSizes, fontWeights, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface InstagramConnectRowProps {
  phase: InstagramConnectPhaseType;
  onConnect: () => void;
  /** Opens the manual handle form in this row's place. */
  onManual: () => void;
}

/** Instagram not linked yet (spec §1): Connect with Instagram first, the manual handle review as the quiet alternative. */
export const InstagramConnectRow = ({ phase, onConnect, onManual }: InstagramConnectRowProps): React.JSX.Element => (
  <View style={styles.row}>
    <View style={styles.head}>
      <CreatorPlatformMark platform={CreatorPlatform.Instagram} size={creatorMarkGeometry.row} />
      <SizedText size={fontSizes.body} weight={fontWeights.bold} numberOfLines={ValueConstants.one}>
        {creatorPlatformName(CreatorPlatform.Instagram)}
      </SizedText>
    </View>
    <InstagramConnectBlock phase={phase} onConnect={onConnect} label={t().instagram.connect} showBody onManual={onManual} />
  </View>
);

const styles = StyleSheet.create({
  row: { padding: spacing.lg, gap: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
