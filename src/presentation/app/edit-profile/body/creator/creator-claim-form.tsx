import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { CreatorHandleRules } from '@domain/creators/creator-handle-rules';
import { CreatorPlatform, type CreatorPlatformType } from '@domain/creators/creator-platform';
import { CharConstants, ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useSeveritySurfaces } from '@presentation/base/theme/colors/surfaces/use-severity-surfaces';
import { borderWidths, controlSizes, fontSizes, fontWeights, lineHeights, radii, spacing } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { PillButton } from '@presentation/base/widgets/buttons/pill-button';
import { PillButtonTone } from '@presentation/base/widgets/buttons/pill-button-tone';
import { t } from '@presentation/i18n';
import { CreatorPlatformOption } from '@presentation/app/edit-profile/items/creator-platform-option';

export interface CreatorClaimFormProps {
  platform: CreatorPlatformType;
  handle: string;
  error: string | null;
  canCancel: boolean;
  isBusy: boolean;
  onPickPlatform: (platform: CreatorPlatformType) => void;
  onChangeHandle: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const PLATFORMS = Object.values(CreatorPlatform);

/**
 * The claim form: pick Instagram or TikTok, type the username after a fixed
 * `@`, send for review.
 *
 * @remarks
 * - **The hint becomes the error.** A refused handle replaces the rules line
 *   with the refusal's copy, in the danger text colour, so the field says what
 *   to fix where the user is looking.
 * - **No autocorrect or capitals**: a handle is lower-case and not a word.
 */
export const CreatorClaimForm = (props: CreatorClaimFormProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const danger = useSeveritySurfaces().danger;
  const [focused, setFocused] = useState(false);
  const { Max } = CreatorHandleRules.Length[props.platform];
  const hasHandle = props.handle.trim().length > ValueConstants.zero;
  const fieldBorder = props.error !== null ? danger.icon : focused ? colors.inputBorderFocused : colors.inputBorder;

  return (
    <>
      <View accessibilityRole="radiogroup" accessibilityLabel={t().creators.account.platformLabel} style={styles.options}>
        {PLATFORMS.map((platform) => (
          <CreatorPlatformOption key={platform} platform={platform} selected={platform === props.platform} onPick={props.onPickPlatform} />
        ))}
      </View>
      <View style={styles.field}>
        <SizedText size={fontSizes.caption} weight={fontWeights.semibold}>
          {t().creators.account.handleLabel}
        </SizedText>
        <View style={[styles.input, { borderColor: fieldBorder, backgroundColor: colors.surface }]}>
          <SizedText size={fontSizes.body} color={colors.textSubtle}>
            {CreatorHandleRules.Prefix}
          </SizedText>
          <TextInput
            value={props.handle}
            onChangeText={props.onChangeHandle}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={props.onSubmit}
            accessibilityLabel={t().creators.account.handleLabel}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            returnKeyType="send"
            maxLength={Max + CreatorHandleRules.Prefix.length}
            placeholder={CharConstants.empty}
            style={[styles.text, { color: colors.text }]}
          />
        </View>
        <SizedText
          size={fontSizes.small}
          ratio={lineHeights.normal}
          color={props.error !== null ? danger.text : colors.textSubtle}
          accessibilityLiveRegion={props.error !== null ? 'polite' : 'none'}
        >
          {props.error ?? t().creators.account.handleHint}
        </SizedText>
      </View>
      <PillButton label={t().creators.account.submit} onPress={props.onSubmit} loading={props.isBusy} disabled={!hasHandle} />
      {props.canCancel ? (
        <PillButton label={t().creators.account.cancel} tone={PillButtonTone.Outline} onPress={props.onCancel} disabled={props.isBusy} />
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  options: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  field: {
    gap: spacing.xs2,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    minHeight: controlSizes.buttonSm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
  },
  text: {
    flex: ValueConstants.one,
    fontSize: fontSizes.body,
    paddingVertical: spacing.sm,
  },
});
