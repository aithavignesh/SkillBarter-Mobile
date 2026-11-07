import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Modal,
  Alert,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { CommunityPostDto, ConnectionDto } from "@/types";
import { Header } from "@/components/navigation/Header";
import { Avatar } from "@/components/common/Avatar";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Input } from "@/components/common/Input";
import { SkeletonCard } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { colors, typography, spacing } from "@/constants/theme";

export default function CommunityScreen() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"posts" | "connections">("posts");

  // Create Post Modal
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postTags, setPostTags] = useState("");
  const [postSubmitting, setPostSubmitting] = useState(false);

  // Fetch Community Posts
  const {
    data: posts,
    isLoading: postsLoading,
    refetch: refetchPosts,
    isRefetching: postsRefetching,
  } = useQuery({
    queryKey: ["community", "posts"],
    queryFn: () => api.community.listPosts(),
    enabled: activeTab === "posts",
  });

  // Fetch Connections
  const {
    data: connectionsData,
    isLoading: connectionsLoading,
    refetch: refetchConnections,
    isRefetching: connectionsRefetching,
  } = useQuery({
    queryKey: ["community", "connections"],
    queryFn: () => api.community.listConnections(),
    enabled: activeTab === "connections",
  });

  const handleCreatePost = async () => {
    if (postTitle.trim().length < 3) {
      Alert.alert("Error", "Title must be at least 3 characters");
      return;
    }
    if (postContent.trim().length < 10) {
      Alert.alert("Error", "Content must be at least 10 characters");
      return;
    }

    setPostSubmitting(true);
    try {
      const tags = postTags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await api.community.createPost({
        title: postTitle.trim(),
        content: postContent.trim(),
        tags,
      });

      setPostModalVisible(false);
      setPostTitle("");
      setPostContent("");
      setPostTags("");
      await refetchPosts();
    } catch (err: any) {
      Alert.alert("Post Error", err.message || "Failed to create post.");
    } finally {
      setPostSubmitting(false);
    }
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.community.deletePost(postId);
            await refetchPosts();
          } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to delete post.");
          }
        },
      },
    ]);
  };

  const handleAcceptConnection = async (id: string) => {
    try {
      await api.community.acceptConnection(id);
      await refetchConnections();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to accept connection.");
    }
  };

  const handleRemoveConnection = async (id: string) => {
    try {
      await api.community.removeConnection(id);
      await refetchConnections();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to remove connection.");
    }
  };

  const connections = connectionsData?.connections || [];

  return (
    <View style={styles.container}>
      <Header
        title="Community Hub"
        showBack
        rightAction={
          activeTab === "posts" ? (
            <Button
              title="+ Post"
              size="sm"
              variant="primary"
              onPress={() => setPostModalVisible(true)}
            />
          ) : undefined
        }
      />

      {/* Tabs Switcher */}
      <View style={styles.tabBar}>
        <Pressable
          onPress={() => setActiveTab("posts")}
          style={[styles.tabBtn, activeTab === "posts" && styles.tabBtnActive]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "posts" && styles.tabTextActive,
            ]}
          >
            Feed & Discussions
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("connections")}
          style={[
            styles.tabBtn,
            activeTab === "connections" && styles.tabBtnActive,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "connections" && styles.tabTextActive,
            ]}
          >
            My Connections ({connections.length})
          </Text>
        </Pressable>
      </View>

      {activeTab === "posts" ? (
        postsLoading ? (
          <View style={{ padding: spacing.md }}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : (
          <FlatList
            data={posts || []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={postsRefetching}
                onRefresh={() => refetchPosts()}
                tintColor={colors.primary}
              />
            }
            renderItem={({ item }: { item: CommunityPostDto }) => {
              const isAuthor = item.authorId === user?.id;
              return (
                <Card style={styles.postCard}>
                  <View style={styles.authorRow}>
                    <Avatar
                      name={item.authorName || "Author"}
                      url={item.authorAvatar}
                      size={40}
                    />
                    <View style={styles.authorInfo}>
                      <Text style={styles.authorName}>
                        {item.authorName || "Community Member"}
                      </Text>
                      <Text style={styles.postDate}>
                        {new Date(item.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                    </View>
                    {isAuthor && (
                      <Pressable onPress={() => handleDeletePost(item.id)}>
                        <Text style={{ color: colors.danger, fontSize: 13 }}>
                          Delete
                        </Text>
                      </Pressable>
                    )}
                  </View>

                  <Text style={styles.postTitle}>{item.title}</Text>
                  <Text style={styles.postContent}>{item.content}</Text>

                  {item.tags && item.tags.length > 0 && (
                    <View style={styles.tagsRow}>
                      {item.tags.map((t, idx) => (
                        <Badge
                          key={idx}
                          label={`#${t}`}
                          variant="neutral"
                          style={{ marginRight: 6 }}
                        />
                      ))}
                    </View>
                  )}
                </Card>
              );
            }}
            ListEmptyComponent={
              <EmptyState
                title="No Community Posts Yet"
                description="Share an update, learning tip, or discussion topic with fellow barter members!"
                actionTitle="Create First Post"
                onAction={() => setPostModalVisible(true)}
              />
            }
          />
        )
      ) : connectionsLoading ? (
        <View style={{ padding: spacing.md }}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={connections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={connectionsRefetching}
              onRefresh={() => refetchConnections()}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }: { item: ConnectionDto }) => {
            const isPending = item.status === "PENDING";
            const isRecipient = item.recipientId === user?.id;
            return (
              <Card style={styles.connCard}>
                <View style={styles.connInfo}>
                  <Avatar
                    name={item.otherUser?.displayName || "Member"}
                    url={item.otherUser?.avatarUrl}
                    size={44}
                  />
                  <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                    <Text style={styles.connName}>
                      {item.otherUser?.displayName || "Member"}
                    </Text>
                    <Badge
                      label={item.status}
                      variant={
                        item.status === "ACCEPTED"
                          ? "secondary"
                          : item.status === "PENDING"
                          ? "warning"
                          : "neutral"
                      }
                      style={{ marginTop: 2 }}
                    />
                  </View>
                </View>

                {isPending && isRecipient ? (
                  <View style={styles.connActions}>
                    <Button
                      title="Accept"
                      size="sm"
                      variant="secondary"
                      onPress={() => handleAcceptConnection(item.id)}
                    />
                    <Button
                      title="Decline"
                      size="sm"
                      variant="ghost"
                      onPress={() => handleRemoveConnection(item.id)}
                    />
                  </View>
                ) : (
                  <Button
                    title="Remove"
                    size="sm"
                    variant="ghost"
                    textStyle={{ color: colors.danger }}
                    onPress={() => handleRemoveConnection(item.id)}
                  />
                )}
              </Card>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              title="No Peer Connections"
              description="Connect with members whose skills inspire you to build your network."
            />
          }
        />
      )}

      {/* Create Post Modal */}
      <Modal visible={postModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Publish Community Post</Text>

            <Input
              label="Title *"
              placeholder="e.g. Tips for learning React Native quickly"
              value={postTitle}
              onChangeText={setPostTitle}
            />

            <Input
              label="Content *"
              placeholder="Share insights, tips, or ask questions to the community..."
              value={postContent}
              onChangeText={setPostContent}
              multiline
              numberOfLines={4}
            />

            <Input
              label="Tags (comma separated)"
              placeholder="e.g. reactnative, typescript, mobile"
              value={postTags}
              onChangeText={setPostTags}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="ghost"
                style={{ flex: 1 }}
                onPress={() => setPostModalVisible(false)}
              />
              <Button
                title="Publish"
                variant="primary"
                style={{ flex: 1 }}
                loading={postSubmitting}
                onPress={handleCreatePost}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
    backgroundColor: colors.cardDark,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  tabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.sm,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
  listContent: {
    padding: spacing.md,
  },
  postCard: {
    marginBottom: spacing.md,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  authorInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  authorName: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  postDate: {
    color: colors.textMuted,
    fontSize: 10,
  },
  postTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    marginBottom: 4,
  },
  postContent: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.sm,
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing.sm,
  },
  connCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  connInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  connName: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  connActions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.cardDark,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
