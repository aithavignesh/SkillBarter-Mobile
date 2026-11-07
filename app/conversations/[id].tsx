import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { MessageDto } from "@/types";
import { Header } from "@/components/navigation/Header";
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { colors, borderRadius, typography, spacing } from "@/constants/theme";

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [inputContent, setInputContent] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);

  const {
    data: messages,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["conversation", id, "messages"],
    queryFn: () => api.messages.getMessages(id!),
    enabled: !!id,
    refetchInterval: 3500, // Active chat polling every 3.5 seconds
  });

  const messageList = (messages || []).slice().reverse(); // Show newest at bottom if inverted or regular

  const handleSend = async () => {
    const text = inputContent.trim();
    if (!text || sending) return;

    setSending(true);
    setSendError(null);
    try {
      await api.messages.sendMessage(id!, text);
      setInputContent("");
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch (err: any) {
      setSendError(err.message || "Failed to send message. Please retry.");
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <Header title="Conversation" showBack />

      {sendError && (
        <View style={{ paddingHorizontal: spacing.md }}>
          <ErrorAlert message={sendError} onRetry={handleSend} />
        </View>
      )}

      {isLoading ? (
        <LoadingSpinner message="Loading messages..." />
      ) : isError ? (
        <View style={{ padding: spacing.md }}>
          <ErrorAlert
            message={(error as any)?.message || "Failed to load messages."}
            onRetry={() => refetch()}
          />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messageList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          renderItem={({ item }: { item: MessageDto }) => {
            const isMe = item.senderId === user?.id;
            return (
              <View
                style={[
                  styles.bubbleContainer,
                  isMe ? styles.bubbleRight : styles.bubbleLeft,
                ]}
              >
                {!isMe && item.senderName && (
                  <Text style={styles.senderLabel}>{item.senderName}</Text>
                )}
                <View
                  style={[
                    styles.bubble,
                    isMe ? styles.bubbleMe : styles.bubbleThem,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isMe ? styles.textMe : styles.textThem,
                    ]}
                  >
                    {item.content}
                  </Text>
                  <Text
                    style={[
                      styles.timeText,
                      isMe ? styles.timeMe : styles.timeThem,
                    ]}
                  >
                    {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptyDesc}>
                Say hello to introduce yourself and coordinate your skill barter!
              </Text>
            </View>
          }
        />
      )}

      {/* Input Row */}
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Type a message..."
          placeholderTextColor="#64748B"
          value={inputContent}
          onChangeText={setInputContent}
          multiline
          maxLength={2000}
          style={styles.textInput}
        />
        <Pressable
          onPress={handleSend}
          disabled={!inputContent.trim() || sending}
          style={({ pressed }) => [
            styles.sendButton,
            (!inputContent.trim() || sending) && styles.sendButtonDisabled,
            pressed && styles.sendButtonPressed,
          ]}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.sendIcon}>↑</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messageList: {
    padding: spacing.md,
    flexGrow: 1,
  },
  bubbleContainer: {
    marginBottom: spacing.sm,
    maxWidth: "80%",
  },
  bubbleRight: {
    alignSelf: "flex-end",
  },
  bubbleLeft: {
    alignSelf: "flex-start",
  },
  senderLabel: {
    color: colors.textMuted,
    fontSize: 10,
    marginBottom: 2,
    marginLeft: spacing.xs,
  },
  bubble: {
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: typography.fontSizes.sm,
    lineHeight: 20,
  },
  textMe: {
    color: "#FFFFFF",
  },
  textThem: {
    color: colors.textPrimary,
  },
  timeText: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  timeMe: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  timeThem: {
    color: colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
  },
  emptyDesc: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    textAlign: "center",
    marginTop: 4,
    maxWidth: 240,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: spacing.sm,
    backgroundColor: colors.cardDark,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#334155",
    opacity: 0.5,
  },
  sendButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  sendIcon: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    lineHeight: 22,
  },
});
