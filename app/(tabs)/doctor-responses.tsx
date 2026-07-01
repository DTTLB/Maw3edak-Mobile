import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, Alert, Switch, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, CheckCircle, Clock, Send, FileText, ChevronDown, ChevronUp, Filter, User, Search, X } from 'lucide-react-native';
import { config } from '@/utils/config';
import { getSession } from '@/utils/auth';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface Question {
  id: string;
  question_text: string;
  field_type: 'text' | 'number' | 'dropdown' | 'date' | 'boolean' | 'file' | 'textarea';
  options?: any;
  is_required: boolean;
  order_index: number;
}

interface Response {
  question_id: string;
  response_text?: string;
  response_number?: number;
  response_date?: string;
  response_boolean?: boolean;
  response_file_url?: string;
}

interface Questionnaire {
  id: string;
  title: string;
  description?: string;
  doctor_name: string;
  created_at: string;
  status: 'pending' | 'answered';
  total_questions: number;
  answered_questions: number;
  questions: Question[];
  responses: Response[];
}

interface DoctorGroup {
  doctorName: string;
  questionnaires: Questionnaire[];
}

type TabType = 'unanswered' | 'answered';

export default function DoctorQuestionnairesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('unanswered');
  const [expandedQuestionnaire, setExpandedQuestionnaire] = useState<string | null>(null);
  const [expandedDoctors, setExpandedDoctors] = useState<Set<string>>(new Set());
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [showDoctorFilter, setShowDoctorFilter] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  const [submitting, setSubmitting] = useState(false);

  const loadQuestionnaires = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      const session = await getSession();
      if (!session) {
        setError(t('doctorResponses.noSessionFound'));
        return;
      }

      const medicalId = session.patient?.medical_id;

      if (!medicalId) {
        setError(t('doctorResponses.medicalIdNotFound'));
        return;
      }

      const apiUrl = `${config.supabaseUrl}/functions/v1/mobile-get-questionnaires`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ medicalId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('doctorResponses.failedToLoad'));
      }

      if (data.success && data.questionnaires) {
        setQuestionnaires(data.questionnaires);
      }
    } catch (err) {
      console.error('Error loading questionnaires:', err);
      setError(err instanceof Error ? err.message : t('doctorResponses.failedToLoad'));
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [t]);

  useEffect(() => {
    loadQuestionnaires();
  }, [loadQuestionnaires]);

  const onRefresh = () => {
    loadQuestionnaires(true);
  };

  const submitQuestionnaire = async (questionnaireId: string, questions: Question[]) => {
    const responses = questions.map(q => ({
      questionId: q.id,
      fieldType: q.field_type,
      value: formData[q.id] || '',
    }));

    const hasEmptyRequired = questions.some(q =>
      q.is_required && !formData[q.id]
    );

    if (hasEmptyRequired) {
      Alert.alert(t('common.error'), t('doctorResponses.answerRequiredQuestions'));
      return;
    }

    try {
      setSubmitting(true);

      const session = await getSession();
      if (!session) {
        Alert.alert(t('common.error'), t('doctorResponses.noSessionFound'));
        return;
      }

      const medicalId = session.patient?.medical_id;

      const apiUrl = `${config.supabaseUrl}/functions/v1/mobile-submit-questionnaire`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          medicalId,
          questionnaireId,
          responses
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('doctorResponses.failedToSubmit'));
      }

      Alert.alert(t('common.success'), t('doctorResponses.submitSuccess'));

      setFormData({});
      setExpandedQuestionnaire(null);
      await loadQuestionnaires();
    } catch (err) {
      console.error('Error submitting questionnaire:', err);
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('doctorResponses.failedToSubmit'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getResponseValue = (question: Question, responses: Response[]) => {
    const response = responses.find(r => r.question_id === question.id);
    if (!response) return t('doctorResponses.noAnswer');

    switch (question.field_type) {
      case 'text':
      case 'textarea':
      case 'dropdown':
        return response.response_text || t('doctorResponses.noAnswer');
      case 'number':
        return response.response_number?.toString() || t('doctorResponses.noAnswer');
      case 'date':
        return response.response_date || t('doctorResponses.noAnswer');
      case 'boolean':
        return response.response_boolean ? t('common.yes') : t('common.no');
      case 'file':
        return response.response_file_url || t('doctorResponses.noFile');
      default:
        return t('doctorResponses.noAnswer');
    }
  };

  const renderQuestionInput = (question: Question) => {
    switch (question.field_type) {
      case 'text':
        return (
          <TextInput
            style={styles.textInput}
            placeholder={t('doctorResponses.typeAnswerPlaceholder')}
            placeholderTextColor="#9ca3af"
            value={formData[question.id] || ''}
            onChangeText={(text) => setFormData(prev => ({ ...prev, [question.id]: text }))}
          />
        );

      case 'textarea':
        return (
          <TextInput
            style={[styles.textInput, styles.textareaInput]}
            placeholder={t('doctorResponses.typeAnswerPlaceholder')}
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            value={formData[question.id] || ''}
            onChangeText={(text) => setFormData(prev => ({ ...prev, [question.id]: text }))}
          />
        );

      case 'number':
        return (
          <TextInput
            style={styles.textInput}
            placeholder={t('doctorResponses.enterNumberPlaceholder')}
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            value={formData[question.id] || ''}
            onChangeText={(text) => setFormData(prev => ({ ...prev, [question.id]: text }))}
          />
        );

      case 'boolean':
        return (
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>
              {formData[question.id] ? t('common.yes') : t('common.no')}
            </Text>
            <Switch
              value={formData[question.id] || false}
              onValueChange={(value) => setFormData(prev => ({ ...prev, [question.id]: value }))}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>
        );

      case 'date':
        return (
          <TextInput
            style={styles.textInput}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9ca3af"
            value={formData[question.id] || ''}
            onChangeText={(text) => setFormData(prev => ({ ...prev, [question.id]: text }))}
          />
        );

      default:
        return (
          <TextInput
            style={styles.textInput}
            placeholder={t('doctorResponses.typeAnswerPlaceholder')}
            placeholderTextColor="#9ca3af"
            value={formData[question.id] || ''}
            onChangeText={(text) => setFormData(prev => ({ ...prev, [question.id]: text }))}
          />
        );
    }
  };

  const groupByDoctor = (questionnaires: Questionnaire[]): DoctorGroup[] => {
    const grouped: { [key: string]: Questionnaire[] } = {};
    questionnaires.forEach(q => {
      if (!grouped[q.doctor_name]) {
        grouped[q.doctor_name] = [];
      }
      grouped[q.doctor_name].push(q);
    });

    return Object.entries(grouped)
      .map(([doctorName, questionnaires]) => ({
        doctorName,
        questionnaires,
      }))
      .sort((a, b) => a.doctorName.localeCompare(b.doctorName));
  };

  const toggleDoctorExpansion = (doctorName: string) => {
    setExpandedDoctors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(doctorName)) {
        newSet.delete(doctorName);
      } else {
        newSet.add(doctorName);
      }
      return newSet;
    });
  };

  const filteredQuestionnaires = questionnaires.filter(q => {
    const statusMatch = activeTab === 'unanswered' ? q.status === 'pending' : q.status === 'answered';
    const doctorMatch = selectedDoctor === 'all' || q.doctor_name === selectedDoctor;
    return statusMatch && doctorMatch;
  });

  const doctorGroups = groupByDoctor(filteredQuestionnaires);
  const uniqueDoctors = Array.from(new Set(questionnaires.map(q => q.doctor_name))).sort();

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('doctorResponses.title')}</Text>
        <TouchableOpacity onPress={() => setShowDoctorFilter(true)} style={styles.filterButton}>
          <Filter size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {selectedDoctor !== 'all' && (
        <View style={styles.filterBadge}>
          <User size={14} color={colors.primary} />
          <Text style={styles.filterBadgeText}>{selectedDoctor}</Text>
          <TouchableOpacity onPress={() => setSelectedDoctor('all')} style={styles.clearFilterButton}>
            <Text style={styles.clearFilterText}>×</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'unanswered' && styles.activeTab]}
          onPress={() => setActiveTab('unanswered')}
        >
          <Text style={[styles.tabText, activeTab === 'unanswered' && styles.activeTabText]}>
            {t('doctorResponses.unanswered')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'answered' && styles.activeTab]}
          onPress={() => setActiveTab('answered')}
        >
          <Text style={[styles.tabText, activeTab === 'answered' && styles.activeTabText]}>
            {t('doctorResponses.answered')}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.centerContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadQuestionnaires()}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : doctorGroups.length === 0 ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.centerContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <FileText size={48} color={colors.textSecondary} strokeWidth={2} />
          <Text style={styles.emptyText}>
            {activeTab === 'unanswered' ? t('doctorResponses.noUnanswered') : t('doctorResponses.noAnswered')}
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {doctorGroups.map((group) => {
            const isDoctorExpanded = expandedDoctors.has(group.doctorName);
            return (
              <View key={group.doctorName} style={styles.doctorGroup}>
                <TouchableOpacity
                  style={styles.doctorHeader}
                  onPress={() => toggleDoctorExpansion(group.doctorName)}
                >
                  <View style={styles.doctorHeaderLeft}>
                    <User size={20} color={colors.primary} strokeWidth={2} />
                    <View style={styles.doctorInfo}>
                      <Text style={styles.doctorNameText}>{group.doctorName}</Text>
                      <Text style={styles.questionnaireCount}>
                        {group.questionnaires.length === 1
                          ? t('doctorResponses.questionnaireCount', { count: group.questionnaires.length })
                          : t('doctorResponses.questionnaireCount_plural', { count: group.questionnaires.length })}
                      </Text>
                    </View>
                  </View>
                  {isDoctorExpanded ? (
                    <ChevronUp size={20} color={colors.textSecondary} strokeWidth={2} />
                  ) : (
                    <ChevronDown size={20} color={colors.textSecondary} strokeWidth={2} />
                  )}
                </TouchableOpacity>

                {isDoctorExpanded && (
                  <View style={styles.doctorQuestionnaires}>
                    {group.questionnaires.map((item) => (
                      <View key={item.id} style={styles.questionnaireCard}>
                        <View style={styles.questionnaireHeader}>
                          <View style={styles.headerRow}>
                            <View style={styles.statusBadge}>
                              {item.status === 'answered' ? (
                                <CheckCircle size={16} color="#15C2B0" strokeWidth={2} />
                              ) : (
                                <Clock size={16} color="#F59E0B" strokeWidth={2} />
                              )}
                              <Text style={[
                                styles.statusText,
                                item.status === 'answered' ? styles.statusAnswered : styles.statusPending
                              ]}>
                                {item.status === 'answered' ? t('doctorResponses.statusCompleted') : t('doctorResponses.statusPending')}
                              </Text>
                            </View>
                            <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
                          </View>

                          <Text style={styles.questionnaireTitle}>{item.title}</Text>
                          {item.description && (
                            <Text style={styles.questionnaireDescription}>{item.description}</Text>
                          )}

                          <View style={styles.progressContainer}>
                            <Text style={styles.progressText}>
                              {t('doctorResponses.questionsProgress', { answered: item.answered_questions, total: item.total_questions })}
                            </Text>
                          </View>

                          <TouchableOpacity
                            style={styles.expandButton}
                            onPress={() => setExpandedQuestionnaire(
                              expandedQuestionnaire === item.id ? null : item.id
                            )}
                          >
                            <Text style={styles.expandButtonText}>
                              {expandedQuestionnaire === item.id
                                ? (item.status === 'pending' ? t('doctorResponses.hideQuestions') : t('doctorResponses.hideAnswers'))
                                : (item.status === 'pending' ? t('doctorResponses.answerQuestionnaire') : t('doctorResponses.viewAnswers'))}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {expandedQuestionnaire === item.id && item.status === 'pending' && (
                          <View style={styles.questionsContainer}>
                            {item.questions.map((question, index) => (
                              <View key={question.id} style={styles.questionBlock}>
                                <Text style={styles.questionLabel}>
                                  {index + 1}. {question.question_text}
                                  {question.is_required && <Text style={styles.requiredMark}> *</Text>}
                                </Text>
                                {renderQuestionInput(question)}
                              </View>
                            ))}

                            <TouchableOpacity
                              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                              onPress={() => submitQuestionnaire(item.id, item.questions)}
                              disabled={submitting}
                            >
                              {submitting ? (
                                <ActivityIndicator size="small" color={colors.card} />
                              ) : (
                                <>
                                  <Send size={16} color={colors.card} strokeWidth={2} />
                                  <Text style={styles.submitButtonText}>{t('doctorResponses.submitQuestionnaire')}</Text>
                                </>
                              )}
                            </TouchableOpacity>
                          </View>
                        )}

                        {expandedQuestionnaire === item.id && item.status === 'answered' && (
                          <View style={styles.answersContainer}>
                            {item.questions.map((question, index) => (
                              <View key={question.id} style={styles.answerBlock}>
                                <Text style={styles.answerQuestion}>
                                  {index + 1}. {question.question_text}
                                </Text>
                                <Text style={styles.answerText}>
                                  {getResponseValue(question, item.responses)}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      <Modal
        visible={showDoctorFilter}
        transparent={true}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => { setShowDoctorFilter(false); setDoctorSearch(''); }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => { setShowDoctorFilter(false); setDoctorSearch(''); }}
        >
          <TouchableOpacity activeOpacity={1} style={styles.filterModalContent}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>{t('doctorResponses.filterByDoctor')}</Text>
              <View style={styles.modalHeaderActions}>
                <TouchableOpacity onPress={() => { setSelectedDoctor('all'); setShowDoctorFilter(false); setDoctorSearch(''); }} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>{t('doctorResponses.clear')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setShowDoctorFilter(false); setDoctorSearch(''); }}
                  style={styles.modalCloseButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>{t('doctorResponses.doctorSectionTitle')}</Text>
              <TouchableOpacity
                style={[styles.dropdownTrigger, styles.dropdownTriggerOpen]}
                activeOpacity={1}
              >
                <Search size={15} color={colors.textSecondary} />
                <TextInput
                  style={[styles.dropdownSearchInput, { marginLeft: 8, flex: 1 }]}
                  placeholder={t('doctorResponses.searchDoctorsPlaceholder')}
                  placeholderTextColor={colors.textSecondary}
                  value={doctorSearch}
                  onChangeText={setDoctorSearch}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus={false}
                />
                {doctorSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setDoctorSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <X size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
              <View style={styles.dropdownList}>
                <ScrollView
                  style={styles.dropdownFlatList}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                >
                  {[{ name: 'all', label: t('doctorResponses.allDoctors') }, ...uniqueDoctors.filter(d => d.toLowerCase().includes(doctorSearch.toLowerCase())).map(d => ({ name: d, label: d }))].map((item) => (
                    <TouchableOpacity
                      key={item.name}
                      style={[styles.dropdownItem, selectedDoctor === item.name && styles.dropdownItemSelected]}
                      onPress={() => { setSelectedDoctor(item.name); setShowDoctorFilter(false); setDoctorSearch(''); }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.dropdownItemText, selectedDoctor === item.name && styles.dropdownItemTextSelected]}>{item.label}</Text>
                      {selectedDoctor === item.name && <View style={styles.dropdownItemCheck} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundSecondary,
  },
  backButton: {
    padding: 8,
  },
  filterButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: colors.text,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 20,
    gap: 6,
  },
  filterBadgeText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.primary,
    flex: 1,
  },
  clearFilterButton: {
    padding: 2,
  },
  clearFilterText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: colors.primary,
    lineHeight: 20,
  },
  centerContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    minHeight: '100%',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.card,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginTop: 16,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
    fontFamily: 'Inter-SemiBold',
  },
  doctorGroup: {
    marginBottom: 16,
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  doctorHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorNameText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.text,
    marginBottom: 4,
  },
  questionnaireCount: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  doctorQuestionnaires: {
    marginTop: 12,
    paddingLeft: 8,
  },
  questionnaireCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  questionnaireHeader: {
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  statusAnswered: {
    color: '#15C2B0',
  },
  statusPending: {
    color: '#F59E0B',
  },
  questionnaireTitle: {
    fontSize: 17,
    fontFamily: 'Inter-Bold',
    color: colors.text,
    marginBottom: 6,
  },
  questionnaireDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  expandButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  expandButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.card,
  },
  questionsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  questionBlock: {
    marginBottom: 20,
  },
  questionLabel: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: colors.text,
    marginBottom: 8,
  },
  requiredMark: {
    color: colors.error,
  },
  textInput: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: colors.text,
  },
  textareaInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
  },
  switchLabel: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.card,
  },
  answersContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  answerBlock: {
    marginBottom: 16,
  },
  answerQuestion: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  answerText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: colors.text,
    backgroundColor: colors.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  filterModalContent: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
    backgroundColor: colors.card,
    borderRadius: 24,
    paddingTop: 20,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  modalScroll: {
    flexShrink: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  modalFooter: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  filterModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },
  dropdownTriggerOpen: {
    borderColor: colors.primary,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  dropdownTriggerText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  dropdownList: {
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: colors.primary,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  dropdownFlatList: {
    maxHeight: 250,
  },
  dropdownSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  dropdownSearchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 0,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dropdownItemLast: {},
  dropdownItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  dropdownItemText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '400',
  },
  dropdownItemTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  dropdownItemCheck: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 10,
  },
});
