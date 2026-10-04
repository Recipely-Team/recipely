import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { CreatorHandle } from '@domain/creators/creator-handle';
import { CreatorHandleRules } from '@domain/creators/creator-handle-rules';
import type { CreatorPlatformType } from '@domain/creators/creator-platform';
import { CharConstants, ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useSeveritySurfaces } from '@presentation/base/theme/colors/surfaces/use-severity-surfaces';
import { borderWidths, controlSizes, fontSizes, fontWeights, letterSpacings, lineHeights, radii, spacing } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { CreatorPlatformMark } from '@presentation/base/widgets/creators/creator-platform-mark';
import { creatorMarkGeometry } from '@presentation/base/widgets/creators/creator-mark-geometry';
import { creatorPlatformName } from '@presentation/base/widgets/creators/creator-platform-name';
import { t } from '@presentation/i18n';
import { upperCase } from '@presentation/i18n/upper-case';
import { CreatorRowAction } from '@presentation/app/edit-profile/items/creator-row-action';

export interface CreatorLinkFormProps {
  platform: CreatorPlatformType;
  handle: string;
  error: string | null;
  isBusy: boolean;
  onChangeHandle: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

/**
 * The link form, in place of a Link row or a rejected row (design spec §7,
 * rev 2): the platform is the row's, so there is no platform choice — a handle
 * after a fixed `@`, then Cancel and Submit for review.
 *
 * @remarks
 * - **The hint becomes the error.** A refused handle replaces the hint with the
 *   refusal's copy, in the danger text colour, where the user is looking.
 * - **Submit waits for the platform's minimum length** (`CreatorHandle.meetsMinimum`).
 */
export const CreatorLinkForm = (props: CreatorLinkFormProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const danger = useSeveritySurfaces().danger;
  const [focused, setFocused] = useState(false);
  const copy = t().creators.account;
  const { Max } = CreatorHandleRules.Length[props.platform];
  const fieldBorder = props.error !== null ? danger.icon : focused ? colors.inputBorderFocused : colors.inputBorder;

  return (
    <View style={styles.form}>
      <View style={styles.title}>
        <CreatorPlatformMark platform={props.platform} size={creatorMarkGeometry.form} />
        <SizedText size={fontSizes.body} weight={fontWeights.bold} accessibilityRole="header">
          {copy.linkAccount.replace('{platform}', creatorPlatformName(props.platform))}
        </SizedText>
      </View>
      <View style={styles.field}>
        <SizedText size={fontSizes.micro} weight={fontWeights.bold} color={colors.textMuted} style={styles.label}>
          {upperCase(copy.handleLabel)}
        </SizedText>
        <View style={[styles.input, { borderColor: fieldBorder, backgroundColor: colors.background }]}>
          <SizedText size={fontSizes.body} color={colors.textSubtle}>
            {CreatorHandleRules.Prefix}
          </SizedText>
          <TextInput
            value={props.handle}
            onChangeText={props.onChangeHandle}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={props.onSubmit}
            accessibilityLabel={copy.handleLabel}
            autoFocus
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
          {props.error ?? copy.handleHint}
        </SizedText>
      </View>
      <View style={styles.buttons}>
        <CreatorRowAction label={copy.cancel} primary={false} loading={false} disabled={props.isBusy} onPress={props.onCancel} />
        <View style={styles.submit}>
          <CreatorRowAction
            label={copy.submit}
            primary
            fill
            loading={props.isBusy}
            disabled={!CreatorHandle.meetsMinimum(props.handle, props.platform)}
            onPress={props.onSubmit}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  form: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm2,
  },
  field: {
    gap: spacing.xs2,
  },
  label: {
    letterSpacing: letterSpacings.wide,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    minHeight: controlSizes.buttonSm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: borderWidths.thin,
  },
  text: {
    flex: ValueConstants.one,
    fontSize: fontSizes.body,
    paddingVertical: spacing.sm,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  submit: {
    flex: ValueConstants.one,
  },
});
