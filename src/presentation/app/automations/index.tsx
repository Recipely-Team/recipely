import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { StoreStatus } from "@application/store/store-status";
import { ValueConstants } from "@core/constants";
import { useTheme } from "@presentation/base/theme/context/use-theme";
import { useAssistantScrollable } from "@presentation/base/hooks/assistant/actions/use-assistant-scrollable";
import { SizedText } from "@presentation/base/widgets/text/sized-text";
import { ErrorState } from "@presentation/base/widgets/feedback/error-state";
import { PageTitle } from "@presentation/base/widgets/head/page-title";
import { InstagramConnectBlock } from "@presentation/base/widgets/instagram/instagram-connect-block";
import { AutomationMetrics } from "@presentation/base/widgets/instagram/automation-metrics";
import {
  failureContent,
  failureIcon,
} from "@presentation/base/errors/failure-lookups";
import { useAutomations } from "@presentation/app/automations/hooks/use-automations";
import { AutomationsViewKind } from "@presentation/app/automations/model/automations-view-kind";
import { AutomationsBar } from "@presentation/app/automations/shared/items/automations-bar";
import { RulesNote } from "@presentation/app/automations/body/rules-note";
import { AutomationRulesList } from "@presentation/app/automations/body/automation-rules-list";
import { ConfirmSheet } from "@presentation/base/widgets/sheets/confirm-sheet";
import {
  controlSizes,
  fontSizes,
  fontWeights,
  radii,
  spacing,
} from "@presentation/base/theme";
import { t } from "@presentation/i18n";

/**
 * Instagram automations (spec §2): the creator's comment-to-DM rules, paged
 * on scroll, each with its switch — or Connect with Instagram when nothing is
 * linked, and Paused with Reconnect when the link expired.
 */
export const AutomationsScreen = (): React.JSX.Element => {
  const colors = useTheme().colors;
  const vm = useAutomations();
  const scrollable = useAssistantScrollable(
    vm.view === AutomationsViewKind.Rules,
  );
  const copy = t().instagram;
  const rules = vm.rules;

  const newButton =
    vm.view === AutomationsViewKind.Rules ? (
      <Pressable
        onPress={vm.onNew}
        disabled={vm.isPaused}
        accessibilityRole="button"
        accessibilityState={{ disabled: vm.isPaused }}
        style={[
          styles.new,
          {
            backgroundColor: colors.primary,
            opacity: vm.isPaused
              ? AutomationMetrics.disabledOpacity
              : ValueConstants.one,
          },
        ]}
      >
        <SizedText
          size={fontSizes.caption}
          weight={fontWeights.bold}
          color={colors.primaryText}
        >
          {`+ ${copy.newShort}`}
        </SizedText>
      </Pressable>
    ) : undefined;

  const body = (): React.JSX.Element => {
    switch (vm.view) {
      case AutomationsViewKind.Error: {
        if (vm.connectionFailure === null)
          return (
            <ActivityIndicator style={styles.spinner} color={colors.primary} />
          );
        const content = failureContent(vm.connectionFailure);
        return (
          <ErrorState
            icon={failureIcon(vm.connectionFailure)}
            title={content.title}
            body={content.body}
            primaryLabel={copy.tryAgain}
            onPrimary={vm.onRetryConnection}
          />
        );
      }
      case AutomationsViewKind.Loading:
        return (
          <ActivityIndicator style={styles.spinner} color={colors.primary} />
        );
      case AutomationsViewKind.Unavailable:
        return (
          <ErrorState
            icon="logo-instagram"
            title={t().errors.instagramNotConfigured.title}
            body={t().errors.instagramNotConfigured.body}
          />
        );
      case AutomationsViewKind.Locked:
        return (
          <View style={styles.locked}>
            <SizedText
              accessibilityRole="header"
              size={fontSizes.subtitle}
              weight={fontWeights.heavy}
            >
              {copy.lockedTitle}
            </SizedText>
            <InstagramConnectBlock
              phase={vm.phase}
              onConnect={vm.connect}
              label={copy.connect}
              showBody
            />
            <RulesNote />
          </View>
        );
      case AutomationsViewKind.Rules:
        if (rules.status === StoreStatus.Error) {
          const content = failureContent(rules.failure);
          return (
            <ErrorState
              icon={failureIcon(rules.failure)}
              title={content.title}
              body={content.body}
              primaryLabel={copy.tryAgain}
              onPrimary={vm.onRetry}
            />
          );
        }
        return <AutomationRulesList vm={vm} scrollable={scrollable} />;
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <PageTitle subject={copy.automations} />
      <AutomationsBar
        title={copy.automations}
        subtitle={null}
        icon="chevron-back"
        onBack={vm.onBack}
        right={newButton}
      />
      <View style={styles.content}>{body()}</View>
      <ConfirmSheet
        visible={vm.pendingDelete !== null}
        title={copy.deleteRule}
        message={copy.deleteQ}
        confirmLabel={copy.deleteRule}
        destructive
        loading={vm.isDeleting}
        onConfirm={vm.onConfirmDelete}
        onClose={vm.onCloseDelete}
      />
    </View>
  );
};

export default AutomationsScreen;

const styles = StyleSheet.create({
  screen: { flex: ValueConstants.one },
  content: {
    flex: ValueConstants.one,
    width: "100%",
    maxWidth: AutomationMetrics.pageMaxWidth,
    alignSelf: "center",
  },
  spinner: { marginTop: spacing.xl },
  locked: { padding: spacing.lg, gap: spacing.lg },
  new: {
    minHeight: controlSizes.iconBtn,
    paddingHorizontal: spacing.md,
    borderRadius: radii.round,
    justifyContent: "center",
  },
});
