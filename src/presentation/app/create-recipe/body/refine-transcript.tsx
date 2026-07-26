import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, lineHeightFor, iconSizes, controlSizes, decorSizes, layoutSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import type { ChatMessage } from '@domain/drafts/chat-message';
import { ValueConstants } from '@core/constants';

export interface RefineTranscriptProps {
  chatHistory: readonly ChatMessage[];
  refining: boolean;
  onClose: () => void;
}

/** Expanded assistant transcript for the refine dock: header + chat bubbles. */
export const RefineTranscript = ({ chatHistory, refining, onClose }: RefineTranscriptProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const scrollRef = useRef<ScrollView>(null);

  return (
    <View style={{ borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }}>
      <View style={styles.transcriptHeader}>
        <LinearGradient
          colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
          start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
          end={{ x: ValueConstants.one, y: ValueConstants.one }}
          style={styles.assistantBadge}
        >
          <Ionicons name="sparkles" size={iconSizes.md} color={colors.primaryText} />
        </LinearGradient>
        <View style={styles.transcriptHeaderText}>
          <ThemedText style={[styles.assistantName, { color: colors.text }]}>
            {t().createRecipe.assistant}
          </ThemedText>
          <ThemedText variant="caption" style={{ color: colors.textMuted }}>
            {t().createRecipe.refineHint}
          </ThemedText>
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={spacing.sm}
          style={styles.collapseBtn}
          accessibilityRole="button"
          accessibilityLabel={t().createRecipe.closeAssistant}
        >
          <Ionicons name="close" size={iconSizes.md} color={colors.textMuted} />
        </Pressable>
      </View>
      <ScrollView
        ref={scrollRef}
        style={styles.transcript}
        contentContainerStyle={styles.transcriptInner}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {chatHistory.map((message, i) => {
          const isUser = message.role === 'user';
          const bubbleColor = isUser
            ? colors.primary
            : message.error
              ? colors.dangerLight
              : colors.chipBackground;
          const textColor = isUser
            ? colors.primaryText
            : message.error
              ? colors.danger
              : colors.text;
          return (
            <View
              key={`${i}-${message.role}`}
              style={[styles.bubble, { alignSelf: isUser ? 'flex-end' : 'flex-start', backgroundColor: bubbleColor }]}
            >
              <ThemedText style={[styles.bubbleText, { color: textColor }]}>{message.content}</ThemedText>
            </View>
          );
        })}
        {refining ? (
          <View style={[styles.bubble, { alignSelf: 'flex-start', backgroundColor: colors.chipBackground }]}>
            <ThemedText style={[styles.bubbleText, styles.thinking, { color: colors.textMuted }]}>
              {t().createRecipe.refining}
            </ThemedText>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  transcriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  assistantBadge: {
    width: decorSizes.badgeSm,
    height: decorSizes.badgeSm,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transcriptHeaderText: {
    flex: ValueConstants.one,
  },
  assistantName: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
  collapseBtn: {
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transcript: {
    maxHeight: layoutSizes.dropdownMaxHeight,
  },
  transcriptInner: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  bubble: {
    maxWidth: '84%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.xl,
  },
  bubbleText: {
    fontSize: fontSizes.caption,
    lineHeight: lineHeightFor(fontSizes.caption),
  },
  thinking: {
    fontStyle: 'italic',
  },
});
