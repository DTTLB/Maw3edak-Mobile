import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  Send,
  X,
  Loader,
  Plus,
  History,
  Trash2,
  MessageSquare,
  Paperclip,
  FileText,
  File as FileIcon,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
// expo-image-manipulator is a native module and is imported lazily (inside the
// HEIC-conversion path only) so the screen still loads on a dev build that
// hasn't been rebuilt with the module yet.
import { File as FsFile } from 'expo-file-system';
import { createClient } from '@supabase/supabase-js';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getSession } from '@/utils/auth';
import { config } from '@/utils/config';
import {
  ChatSession,
  loadSessions,
  upsertSession,
  deleteSession as deleteSessionStorage,
} from '@/utils/aiSessions';

const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

interface MessageAttachment {
  name: string;
  mimeType: string;
  size: number;
  uri?: string;
}

interface SelectedAttachment {
  name: string;
  uri: string;
  mimeType: string;
  size: number;
  base64: string;
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  image?: string;
  attachment?: MessageAttachment;
  timestamp: number;
}

// Raw file cap. base64 encoding inflates the payload by ~33%, so a 7 MB file
// becomes a ~9.3 MB JSON body — kept under Edge Function / OpenAI request limits.
const MAX_ATTACHMENT_BYTES = 7 * 1024 * 1024; // 7 MB

// File types the AI backend can actually analyze. The document picker is
// restricted to these so users can't attach something that will be rejected
// only after a full upload. image/heic & image/heif cover iOS camera photos.
const SUPPORTED_ATTACHMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fileExtension = (name: string): string => {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop()!.toUpperCase() : '';
};

const isImageMime = (mimeType?: string): boolean =>
  !!mimeType && mimeType.startsWith('image/');

const isPdfMime = (mimeType?: string): boolean =>
  mimeType === 'application/pdf';

const COLORS = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  primary: '#2D7DD2',
  primaryLight: '#EAF3FC',
  border: '#E2E8F0',
  userBubble: '#2D7DD2',
  aiBubble: '#FFFFFF',
};

export default function AIAssistantScreen() {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<SelectedAttachment | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isAttaching, setIsAttaching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const currentSessionIdRef = useRef<string | null>(null);
  const userIdRef = useRef<string | undefined>(undefined);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  // True while we're waiting for the attach-menu Modal to finish dismissing
  // before presenting the native document picker (iOS presentation race).
  const pendingPickRef = useRef(false);

  useEffect(() => {
    requestImagePermissions();
    bootstrapSessions();
  }, []);

  const bootstrapSessions = async () => {
    try {
      const session = await getSession();
      userIdRef.current = session?.user?.id;
      const stored = await loadSessions(userIdRef.current);
      setSessions(stored);
    } catch (error) {
      console.warn('AI: failed to bootstrap sessions', error);
    }
  };

  const persistConversation = useCallback(async (nextMessages: Message[]) => {
    if (nextMessages.length === 0) return;
    let sessionId = currentSessionIdRef.current;
    if (!sessionId) {
      sessionId = `session_${Date.now()}`;
      currentSessionIdRef.current = sessionId;
      setCurrentSessionId(sessionId);
    }
    const updated = await upsertSession(userIdRef.current, {
      id: sessionId,
      messages: nextMessages,
    });
    setSessions(updated);
  }, []);

  const startNewChat = () => {
    setMessages([]);
    currentSessionIdRef.current = null;
    setCurrentSessionId(null);
    setInputText('');
    setSelectedImage(null);
    setSelectedAttachment(null);
    setShowHistory(false);
  };

  const openSession = (session: ChatSession) => {
    setMessages(session.messages);
    currentSessionIdRef.current = session.id;
    setCurrentSessionId(session.id);
    setInputText('');
    setSelectedImage(null);
    setSelectedAttachment(null);
    setShowHistory(false);
  };

  const performDeleteSession = async (session: ChatSession) => {
    const remaining = await deleteSessionStorage(userIdRef.current, session.id);
    setSessions(remaining);
    if (session.id === currentSessionIdRef.current) startNewChat();
  };

  const handleDeleteSession = (session: ChatSession) => {
    const prompt = `Delete "${session.title}"? This cannot be undone.`;
    if (Platform.OS === 'web') {
      // React Native's Alert callbacks don't fire on web; use the browser confirm.
      const confirmed = typeof window !== 'undefined' ? window.confirm(prompt) : true;
      if (confirmed) performDeleteSession(session);
      return;
    }
    Alert.alert('Delete conversation', prompt, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => performDeleteSession(session),
      },
    ]);
  };

  const requestImagePermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Camera permission not granted');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setSelectedImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch {
      Alert.alert(t('common.error'), 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setSelectedImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch {
      Alert.alert(t('common.error'), 'Failed to take photo');
    }
  };

  const handleImagePress = () => {
    Alert.alert(
      'Add Image',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      ]
    );
  };

  const readAsBase64 = async (uri: string): Promise<string> => {
    if (Platform.OS === 'web') {
      // FileSystem cannot read web blob/data URIs; use fetch + FileReader.
      const response = await fetch(uri);
      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result;
          const base64String = String(result).split(',')[1] || '';
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
    return await new FsFile(uri).base64();
  };

  // iOS photos are HEIC/HEIF, which the AI vision backend can't read. Transcode
  // to JPEG (and grab base64 in the same pass) before attaching.
  const convertHeicToJpeg = async (
    uri: string,
    name: string,
  ): Promise<{ uri: string; name: string; mimeType: string; base64: string }> => {
    const { ImageManipulator, SaveFormat } = await import('expo-image-manipulator');
    const context = ImageManipulator.manipulate(uri);
    const rendered = await context.renderAsync();
    const output = await rendered.saveAsync({
      format: SaveFormat.JPEG,
      compress: 0.85,
      base64: true,
    });
    const jpgName = /\.(heic|heif)$/i.test(name)
      ? name.replace(/\.(heic|heif)$/i, '.jpg')
      : `${name}.jpg`;
    return {
      uri: output.uri,
      name: jpgName,
      mimeType: 'image/jpeg',
      base64: output.base64 ?? '',
    };
  };

  // Presenting the native document picker while the attach-menu Modal is still
  // on screen makes iOS silently drop the picker — its completion handler never
  // fires, so the promise hangs and the attach button spins forever. We close
  // the menu first, then launch the picker only AFTER the Modal has fully
  // dismissed. iOS exposes that moment via the Modal's onDismiss callback;
  // Android has no onDismiss, so we fall back to a short delay there.
  const pickDocument = () => {
    if (Platform.OS === 'web') {
      setShowAttachMenu(false);
      void launchDocumentPicker();
      return;
    }
    if (Platform.OS === 'ios') {
      pendingPickRef.current = true;
      setShowAttachMenu(false);
      return;
    }
    // Android
    setShowAttachMenu(false);
    setTimeout(() => {
      void launchDocumentPicker();
    }, 250);
  };

  // Fired once the attach-menu Modal has finished animating out on iOS.
  const handleAttachMenuDismiss = () => {
    if (pendingPickRef.current) {
      pendingPickRef.current = false;
      void launchDocumentPicker();
    }
  };

  const launchDocumentPicker = async () => {
    try {
      setIsAttaching(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: SUPPORTED_ATTACHMENT_TYPES,
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset) {
        Alert.alert(t('common.error'), 'Could not attach this file. Please try again.');
        return;
      }

      // Some file managers (notably on Android) ignore the picker's type
      // filter, so re-validate the mime type here before reading the file.
      const assetMime = asset.mimeType || '';
      if (assetMime && !SUPPORTED_ATTACHMENT_TYPES.includes(assetMime)) {
        Alert.alert(
          t('common.error'),
          'Unsupported file type. Please attach a PDF or an image (JPG, PNG, WEBP, HEIC).',
        );
        return;
      }

      const size = asset.size || 0;
      if (size > MAX_ATTACHMENT_BYTES) {
        Alert.alert(t('common.error'), 'File is too large. Please upload a file under 7 MB.');
        return;
      }

      let fileUri = asset.uri;
      let fileName = asset.name;
      let fileMime = asset.mimeType || 'application/octet-stream';
      let base64String = '';

      try {
        if (assetMime === 'image/heic' || assetMime === 'image/heif') {
          const converted = await convertHeicToJpeg(asset.uri, asset.name);
          fileUri = converted.uri;
          fileName = converted.name;
          fileMime = converted.mimeType;
          base64String = converted.base64;
        }
        if (!base64String) {
          base64String = await readAsBase64(fileUri);
        }
      } catch (readError) {
        console.warn('AI: failed to read attachment as base64', readError);
        Alert.alert(t('common.error'), 'File is selected but not ready to send. Please try again.');
        return;
      }

      setSelectedAttachment({
        name: fileName,
        uri: fileUri,
        mimeType: fileMime,
        size,
        base64: base64String,
      });
    } catch (error) {
      console.warn('AI: document picker error', error);
      Alert.alert(t('common.error'), 'Could not attach this file. Please try again.');
    } finally {
      setIsAttaching(false);
    }
  };

  const removeAttachment = () => setSelectedAttachment(null);

  const sendMessage = async () => {
    if (!inputText.trim() && !selectedImage && !selectedAttachment) return;

    if (selectedAttachment && !selectedAttachment.base64) {
      Alert.alert(t('common.error'), 'File is selected but not ready to send. Please try again.');
      return;
    }

    const outgoingAttachment = selectedAttachment;
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      type: 'user',
      text: inputText,
      image: selectedImage ?? undefined,
      attachment: outgoingAttachment
        ? {
            name: outgoingAttachment.name,
            mimeType: outgoingAttachment.mimeType,
            size: outgoingAttachment.size,
            uri: outgoingAttachment.uri,
          }
        : undefined,
      timestamp: Date.now(),
    };

    const afterUser = [...messages, userMessage];
    const outgoingText = inputText;
    setMessages(afterUser);
    setInputText('');
    setSelectedImage(null);
    setSelectedAttachment(null);
    setIsSending(true);
    persistConversation(afterUser);

    try {
      const session = await getSession();
      if (!session || !session.access_token) {
        console.warn('❌ AI: No session found');
        Alert.alert(t('common.error'), 'Please log in again');
        setIsSending(false);
        return;
      }

      console.log('🤖 AI: Calling mobile-ai-assistant function');
      console.log('📝 AI: Has message:', !!outgoingText.trim());
      console.log('🖼️ AI: Has image:', !!selectedImage);
      console.log('📎 AI: Has attachment:', !!outgoingAttachment);

      const requestBody: {
        message: string;
        imageBase64?: string | null;
        userId?: string;
        language?: string;
        attachment?: {
          name: string;
          mimeType: string;
          size: number;
          base64: string;
        };
      } = {
        message: outgoingText,
        imageBase64: selectedImage,
        // Lets the assistant answer personal questions (e.g. "my next
        // appointment") and reply in the user's language.
        userId: session.patient?.id,
        language: i18n.language,
      };

      if (outgoingAttachment) {
        requestBody.attachment = {
          name: outgoingAttachment.name,
          mimeType: outgoingAttachment.mimeType,
          size: outgoingAttachment.size,
          base64: outgoingAttachment.base64,
        };
      }

      const { data, error } = await supabase.functions.invoke('mobile-ai-assistant', {
        body: requestBody,
      });

      console.log('🔄 AI: Response received');

      if (error) {
        console.error('❌ AI: Function error:', error);
        throw new Error(error.message || 'Failed to get AI response');
      }

      if (!data || !data.reply) {
        console.error('❌ AI: Invalid response format:', data);
        throw new Error('Invalid response format from AI service');
      }

      console.log('✅ AI: Response received successfully');

      const aiMessage: Message = {
        id: `msg_${Date.now()}`,
        type: 'ai',
        text: data.reply,
        timestamp: Date.now(),
      };

      const afterAi = [...afterUser, aiMessage];
      setMessages(afterAi);
      persistConversation(afterAi);
    } catch (error) {
      console.error('❌ AI: Error in sendMessage:', error);
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';

      const displayMessage = __DEV__
        ? `Error: ${errorMessage}`
        : "Sorry, I couldn't process that right now. Please try again.";

      const aiErrorMessage: Message = {
        id: `msg_${Date.now()}`,
        type: 'ai',
        text: displayMessage,
        timestamp: Date.now(),
      };
      const afterError = [...afterUser, aiErrorMessage];
      setMessages(afterError);
      persistConversation(afterError);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'ask':
        inputRef.current?.focus();
        break;
      case 'medicine':
        handleImagePress();
        break;
      case 'prescription':
        setInputText('Can you help me understand this prescription? Please explain what I see in this image.');
        handleImagePress();
        break;
      case 'appointment':
        setInputText('What questions should I ask my doctor before my appointment?');
        inputRef.current?.focus();
        break;
    }
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const styles = createStyles(width, colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>AI Assistant</Text>
              <Text style={styles.headerSubtitle}>
                Ask questions about your care or medication.
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerIconButton}
                onPress={() => setShowHistory(true)}
                accessibilityLabel="Chat history"
              >
                <History size={20} color={COLORS.primary} strokeWidth={2} />
                {sessions.length > 0 && (
                  <View style={styles.headerBadge}>
                    <Text style={styles.headerBadgeText}>{sessions.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {messages.length === 0 ? (
          <ScrollView style={styles.contentContainer}>
            <View style={styles.disclaimerCard}>
              <Text style={styles.disclaimerTitle}>Important Notice</Text>
              <Text style={styles.disclaimerText}>
                AI can make mistakes. This is not medical advice and does not replace your doctor
                or pharmacist.
              </Text>
            </View>

            <View style={styles.quickActionsContainer}>
              <Text style={styles.quickActionsTitle}>Quick Actions</Text>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => handleQuickAction('ask')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#EAF3FC' }]}>
                  <Text style={styles.quickActionIconText}>💬</Text>
                </View>
                <View style={styles.quickActionContent}>
                  <Text style={styles.quickActionTitle}>Ask a Question</Text>
                  <Text style={styles.quickActionSubtitle}>
                    Get general health information
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => handleQuickAction('medicine')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#E4F8F4' }]}>
                  <Text style={styles.quickActionIconText}>💊</Text>
                </View>
                <View style={styles.quickActionContent}>
                  <Text style={styles.quickActionTitle}>Scan Medicine</Text>
                  <Text style={styles.quickActionSubtitle}>
                    Upload a photo of medication
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => handleQuickAction('prescription')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#EAF3FC' }]}>
                  <Text style={styles.quickActionIconText}>📋</Text>
                </View>
                <View style={styles.quickActionContent}>
                  <Text style={styles.quickActionTitle}>Explain Prescription</Text>
                  <Text style={styles.quickActionSubtitle}>
                    Get details from prescription images
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => handleQuickAction('appointment')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#E4F8F4' }]}>
                  <Text style={styles.quickActionIconText}>📅</Text>
                </View>
                <View style={styles.quickActionContent}>
                  <Text style={styles.quickActionTitle}>Appointment Guidance</Text>
                  <Text style={styles.quickActionSubtitle}>
                    Prepare questions for your doctor
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageBubbleWrapper,
                  message.type === 'user' && styles.userMessageWrapper,
                  message.type === 'ai' && styles.aiMessageWrapper,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    message.type === 'user'
                      ? styles.userBubble
                      : styles.aiBubble,
                  ]}
                >
                  {message.image && (
                    <Image
                      source={{ uri: message.image }}
                      style={styles.messageImage}
                    />
                  )}
                  {message.attachment && (
                    <View style={styles.bubbleAttachmentChip}>
                      {isImageMime(message.attachment.mimeType) && message.attachment.uri ? (
                        <Image
                          source={{ uri: message.attachment.uri }}
                          style={styles.bubbleAttachmentThumb}
                        />
                      ) : (
                        <View style={styles.bubbleAttachmentIcon}>
                          {isPdfMime(message.attachment.mimeType) ? (
                            <FileText size={18} color="#2D7DD2" strokeWidth={2} />
                          ) : isImageMime(message.attachment.mimeType) ? (
                            <Camera size={18} color="#2D7DD2" strokeWidth={2} />
                          ) : (
                            <FileIcon size={18} color="#2D7DD2" strokeWidth={2} />
                          )}
                        </View>
                      )}
                      <View style={styles.bubbleAttachmentInfo}>
                        <Text style={styles.bubbleAttachmentName} numberOfLines={1}>
                          {message.attachment.name}
                        </Text>
                        <Text style={styles.bubbleAttachmentMeta} numberOfLines={1}>
                          {[fileExtension(message.attachment.name), formatFileSize(message.attachment.size)]
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                      </View>
                    </View>
                  )}
                  {!!message.text && (
                    <Text
                      style={[
                        styles.messageText,
                        message.type === 'user'
                          ? styles.userMessageText
                          : styles.aiMessageText,
                      ]}
                    >
                      {message.text}
                    </Text>
                  )}
                </View>
              </View>
            ))}
            {isSending && (
              <View style={[styles.messageBubbleWrapper, styles.aiMessageWrapper]}>
                <View style={[styles.messageBubble, styles.aiBubble]}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={[styles.messageText, styles.aiMessageText]}>
                    Thinking...
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {selectedImage && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setSelectedImage(null)}
            >
              <X size={16} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        )}

        {selectedAttachment && (
          <View style={styles.attachmentPreviewContainer}>
            <View style={styles.attachmentChip}>
              {isImageMime(selectedAttachment.mimeType) ? (
                <Image
                  source={{ uri: selectedAttachment.uri }}
                  style={styles.attachmentThumb}
                />
              ) : (
                <View style={styles.attachmentChipIcon}>
                  {isPdfMime(selectedAttachment.mimeType) ? (
                    <FileText size={20} color={COLORS.primary} strokeWidth={2} />
                  ) : (
                    <FileIcon size={20} color={COLORS.primary} strokeWidth={2} />
                  )}
                </View>
              )}
              <View style={styles.attachmentChipInfo}>
                <Text style={styles.attachmentChipName} numberOfLines={1}>
                  {selectedAttachment.name}
                </Text>
                <Text style={styles.attachmentChipMeta} numberOfLines={1}>
                  {[fileExtension(selectedAttachment.name), formatFileSize(selectedAttachment.size)]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.attachmentRemoveButton}
                onPress={removeAttachment}
                accessibilityLabel="Remove attachment"
              >
                <X size={16} color={COLORS.textSecondary} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowAttachMenu(true)}
            disabled={isSending || isAttaching}
            accessibilityLabel="Add attachment"
          >
            {isAttaching ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Plus size={20} color={COLORS.primary} strokeWidth={2} />
            )}
          </TouchableOpacity>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Ask anything about your care..."
            placeholderTextColor={COLORS.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            editable={!isSending}
          />
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleImagePress}
            disabled={isSending}
          >
            <Camera size={20} color={COLORS.primary} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={isSending || (!inputText.trim() && !selectedImage && !selectedAttachment)}
          >
            {isSending ? (
              <Loader size={20} color="#FFFFFF" strokeWidth={2} />
            ) : (
              <Send size={20} color="#FFFFFF" strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showAttachMenu}
        animationType="fade"
        transparent
        onRequestClose={() => setShowAttachMenu(false)}
        onDismiss={handleAttachMenuDismiss}
      >
        <TouchableOpacity
          style={styles.attachMenuOverlay}
          activeOpacity={1}
          onPress={() => setShowAttachMenu(false)}
        >
          <View style={styles.attachMenuSheet}>
            <TouchableOpacity style={styles.attachMenuItem} onPress={pickDocument}>
              <View style={styles.attachMenuIcon}>
                <Paperclip size={20} color={COLORS.primary} strokeWidth={2} />
              </View>
              <Text style={styles.attachMenuItemText}>Add photos &amp; files</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.attachMenuCancel}
              onPress={() => setShowAttachMenu(false)}
            >
              <Text style={styles.attachMenuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showHistory}
        animationType="slide"
        transparent
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Saved Conversations</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowHistory(false)}
              >
                <X size={20} color={COLORS.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.newChatRow} onPress={startNewChat}>
              <View style={styles.newChatIcon}>
                <Plus size={18} color={COLORS.primary} strokeWidth={2.5} />
              </View>
              <Text style={styles.newChatText}>New conversation</Text>
            </TouchableOpacity>

            {sessions.length === 0 ? (
              <View style={styles.emptyHistory}>
                <MessageSquare size={32} color={COLORS.textSecondary} strokeWidth={1.5} />
                <Text style={styles.emptyHistoryText}>
                  No saved conversations yet. Start chatting and your sessions will appear here.
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.sessionList}>
                {sessions.map((session) => (
                  <View
                    key={session.id}
                    style={[
                      styles.sessionRow,
                      session.id === currentSessionId && styles.sessionRowActive,
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.sessionInfo}
                      onPress={() => openSession(session)}
                    >
                      <Text style={styles.sessionTitle} numberOfLines={1}>
                        {session.title}
                      </Text>
                      <Text style={styles.sessionMeta}>
                        {session.messages.length}{' '}
                        {session.messages.length === 1 ? 'message' : 'messages'} ·{' '}
                        {new Date(session.updatedAt).toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.sessionDeleteButton}
                      onPress={() => handleDeleteSession(session)}
                      accessibilityLabel="Delete conversation"
                    >
                      <Trash2 size={18} color="#FF6F61" strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (width: number, colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: COLORS.card,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    headerTextWrap: {
      flex: 1,
      paddingRight: 12,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    headerIconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: COLORS.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerBadge: {
      position: 'absolute',
      top: -2,
      right: -2,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 4,
      backgroundColor: COLORS.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontFamily: 'Inter-Bold',
    },
    headerTitle: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: COLORS.text,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: COLORS.textSecondary,
    },
    contentContainer: {
      flex: 1,
      padding: 16,
    },
    disclaimerCard: {
      backgroundColor: COLORS.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    disclaimerTitle: {
      fontSize: 14,
      fontFamily: 'Inter-Bold',
      color: COLORS.text,
      marginBottom: 8,
    },
    disclaimerText: {
      fontSize: 13,
      fontFamily: 'Inter-Regular',
      color: COLORS.textSecondary,
      lineHeight: 20,
    },
    quickActionsContainer: {
      marginBottom: 32,
    },
    quickActionsTitle: {
      fontSize: 16,
      fontFamily: 'Inter-Bold',
      color: COLORS.text,
      marginBottom: 12,
    },
    quickActionCard: {
      flexDirection: 'row',
      backgroundColor: COLORS.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      alignItems: 'flex-start',
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    quickActionIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    quickActionIconText: {
      fontSize: 24,
    },
    quickActionContent: {
      flex: 1,
    },
    quickActionTitle: {
      fontSize: 15,
      fontFamily: 'Inter-Bold',
      color: COLORS.text,
      marginBottom: 4,
    },
    quickActionSubtitle: {
      fontSize: 13,
      fontFamily: 'Inter-Regular',
      color: COLORS.textSecondary,
    },
    messagesContainer: {
      flex: 1,
      paddingHorizontal: 16,
    },
    messagesContent: {
      paddingVertical: 16,
    },
    messageBubbleWrapper: {
      marginBottom: 12,
    },
    userMessageWrapper: {
      alignItems: 'flex-end',
    },
    aiMessageWrapper: {
      alignItems: 'flex-start',
    },
    messageBubble: {
      maxWidth: '80%',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 16,
    },
    userBubble: {
      backgroundColor: COLORS.userBubble,
    },
    aiBubble: {
      backgroundColor: COLORS.aiBubble,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    messageImage: {
      width: 200,
      height: 150,
      borderRadius: 8,
      marginBottom: 8,
    },
    messageText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      lineHeight: 20,
    },
    userMessageText: {
      color: '#FFFFFF',
    },
    aiMessageText: {
      color: COLORS.text,
    },
    imagePreviewContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      position: 'relative',
    },
    imagePreview: {
      width: '100%',
      height: 120,
      borderRadius: 8,
    },
    removeImageButton: {
      position: 'absolute',
      top: 12,
      right: 24,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    attachmentPreviewContainer: {
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    attachmentChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#EAF3FC',
      borderWidth: 1,
      borderColor: '#EAF3FC',
      borderRadius: 14,
      padding: 8,
      gap: 10,
    },
    attachmentChipIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#EAF3FC',
      justifyContent: 'center',
      alignItems: 'center',
    },
    attachmentThumb: {
      width: 40,
      height: 40,
      borderRadius: 10,
    },
    attachmentChipInfo: {
      flex: 1,
      minWidth: 0,
    },
    attachmentChipName: {
      fontSize: 13,
      fontFamily: 'Inter-Bold',
      color: '#0F172A',
    },
    attachmentChipMeta: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: '#64748B',
      marginTop: 2,
    },
    attachmentRemoveButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    bubbleAttachmentChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#EAF3FC',
      borderWidth: 1,
      borderColor: '#EAF3FC',
      borderRadius: 14,
      padding: 8,
      gap: 10,
      marginBottom: 8,
    },
    bubbleAttachmentIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#EAF3FC',
      justifyContent: 'center',
      alignItems: 'center',
    },
    bubbleAttachmentThumb: {
      width: 36,
      height: 36,
      borderRadius: 10,
    },
    bubbleAttachmentInfo: {
      flexShrink: 1,
      minWidth: 0,
    },
    bubbleAttachmentName: {
      fontSize: 13,
      fontFamily: 'Inter-Bold',
      color: '#0F172A',
    },
    bubbleAttachmentMeta: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: '#64748B',
      marginTop: 2,
    },
    attachMenuOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'flex-end',
    },
    attachMenuSheet: {
      backgroundColor: COLORS.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 28,
      gap: 8,
    },
    attachMenuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: COLORS.background,
      gap: 12,
    },
    attachMenuIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: COLORS.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    attachMenuItemText: {
      fontSize: 15,
      fontFamily: 'Inter-Bold',
      color: COLORS.text,
    },
    attachMenuCancel: {
      paddingVertical: 14,
      alignItems: 'center',
      borderRadius: 14,
      backgroundColor: COLORS.background,
    },
    attachMenuCancelText: {
      fontSize: 15,
      fontFamily: 'Inter-Bold',
      color: COLORS.textSecondary,
    },
    inputContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: COLORS.card,
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
      alignItems: 'flex-end',
      gap: 8,
    },
    input: {
      flex: 1,
      backgroundColor: COLORS.background,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: COLORS.text,
      maxHeight: 100,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: COLORS.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: COLORS.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: COLORS.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 24,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },
    modalTitle: {
      fontSize: 18,
      fontFamily: 'Inter-Bold',
      color: COLORS.text,
    },
    modalCloseButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: COLORS.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    newChatRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
      gap: 12,
    },
    newChatIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: COLORS.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    newChatText: {
      fontSize: 15,
      fontFamily: 'Inter-Bold',
      color: COLORS.primary,
    },
    emptyHistory: {
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingVertical: 48,
      gap: 12,
    },
    emptyHistoryText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: COLORS.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    sessionList: {
      paddingHorizontal: 8,
    },
    sessionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    sessionRowActive: {
      backgroundColor: COLORS.primaryLight,
    },
    sessionInfo: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 8,
    },
    sessionTitle: {
      fontSize: 15,
      fontFamily: 'Inter-Bold',
      color: COLORS.text,
      marginBottom: 4,
    },
    sessionMeta: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: COLORS.textSecondary,
    },
    sessionDeleteButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
