import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { AvatarImage } from '@presentation/base/widgets/media/avatar-image';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { spacing, fontWeights, iconSizes, controlSizes, avatarSizes, borderWidths, opacities } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';
import { CreatorBadge } from '@presentation/base/widgets/creators/creator-badge';
import { creatorMarkGeometry } from '@presentation/base/widgets/creators/creator-mark-geometry';
import { useLayout } from '@presentation/base/responsive/use-layout';

const AVATAR_FRAME = avatarSizes.frame;
const AVATAR_INNER = avatarSizes.frameInner;
const CAMERA_BTN = controlSizes.iconBtnSm;
const CAMERA_ICON = iconSizes.sm;

export interface ProfileIdentityProps {
  displayName: string;
  handle: string;
  bio: string;
  photoUri: string | undefined;
  isUploading: boolean;
  onPickAvatar: () => void;
  onAddBio: () => void;
  /** At least one platform approved: the one approved badge beside the name. */
  isCreator: boolean;
}

/**
 * Avatar (with upload overlay + camera button), display name with the
 * approved-creator badge (22, or 20 on the web shell), `@handle` in
 * `textSubtle` and bio (design spec → Creators §8).
 */
export const ProfileIdentity = ({
  displayName,
  handle,
  bio,
  photoUri,
  isUploading,
  onPickAvatar,
  onAddBio,
  isCreator,
}: ProfileIdentityProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const { isWebShell } = useLayout();

  return (
    <View style={[styles.identityBlock, { paddingTop: isWebShell ? spacing.xxl : spacing.lg }]}>
      <View style={styles.avatarWrap}>
        <View
          style={[
            styles.avatarFrame,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
            shadows.sm,
          ]}
        >
          <AvatarImage uri={photoUri} name={displayName} size={AVATAR_INNER} />
          {isUploading ? (
            <View style={[styles.avatarOverlay, { backgroundColor: colors.overlay }]}>
              <ActivityIndicator color={colors.onOverlay} />
            </View>
          ) : null}
        </View>
        <Pressable
          onPress={onPickAvatar}
          disabled={isUploading}
          style={[
            styles.cameraBtn,
            { backgroundColor: colors.primary, borderColor: colors.background },
            shadows.sm,
            isUploading ? styles.cameraBtnDisabled : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t().profile.changePhoto}
        >
          <Ionicons name="camera" size={CAMERA_ICON} color={colors.primaryText} />
        </Pressable>
      </View>

      <View style={styles.nameRow}>
        <ThemedText variant="title" style={styles.displayName}>
          {displayName}
        </ThemedText>
        {isCreator ? (
          <CreatorBadge size={isWebShell ? creatorMarkGeometry.badgeProfileWeb : creatorMarkGeometry.badgeProfile} />
        ) : null}
      </View>
      {handle.length > ValueConstants.zero ? (
        <ThemedText variant="caption" style={[styles.handle, { color: colors.textSubtle }]}>
          @{handle}
        </ThemedText>
      ) : null}
      {bio.length > ValueConstants.zero ? (
        <ThemedText variant="body" style={styles.bioText}>
          {bio}
        </ThemedText>
      ) : (
        <Pressable
          onPress={onAddBio}
          style={styles.bioPrompt}
          hitSlop={spacing.sm}
          accessibilityRole="button"
          accessibilityLabel={t().profile.addBioPrompt}
        >
          <ThemedText variant="caption" muted style={styles.bioPromptText}>
            {t().profile.addBioPrompt}
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  identityBlock: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  avatarWrap: {
    width: AVATAR_FRAME,
    height: AVATAR_FRAME,
    position: 'relative',
  },
  avatarFrame: {
    width: AVATAR_FRAME,
    height: AVATAR_FRAME,
    borderRadius: AVATAR_FRAME / ValueConstants.two,
    padding: (AVATAR_FRAME - AVATAR_INNER) / ValueConstants.two,
    borderWidth: borderWidths.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: AVATAR_FRAME / ValueConstants.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: -spacing.xxs,
    right: -spacing.xxs,
    width: CAMERA_BTN,
    height: CAMERA_BTN,
    borderRadius: CAMERA_BTN / ValueConstants.two,
    borderWidth: borderWidths.thick,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBtnDisabled: {
    opacity: opacities.disabledFaint,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  displayName: {
    flexShrink: ValueConstants.one,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
  handle: {
    marginTop: spacing.xxs,
    textAlign: 'center',
  },
  bioText: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  bioPrompt: {
    marginTop: spacing.sm,
  },
  bioPromptText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
