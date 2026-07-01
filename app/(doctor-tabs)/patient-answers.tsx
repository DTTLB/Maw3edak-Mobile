import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { FileText, User, Calendar, ChevronRight, ChevronDown, ArrowLeft, X, CheckCircle, ClipboardList, Search } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { config } from '@/utils/config';
import { getDoctorPalette, DoctorPalette } from '@/utils/doctorPalette';

interface Question {
  id: string;
  question_text: string;
  field_type: 'text' | 'number' | 'dropdown' | 'date' | 'boolean' | 'file' | 'textarea';
  options?: any;
  is_required: boolean;
  order_index: number;
}

interface Response {
  id: string;
  patient_id: string;
  questionnaire_id: string;
  question_id: string;
  response_text?: string;
  response_number?: number;
  response_date?: string;
  response_boolean?: boolean;
  response_file_url?: string;
  created_at: string;
}

interface PatientAnswer {
  assignment_id: string;
  questionnaire_id: string;
  questionnaire_title: string;
  patient_id: string;
  patient_medical_id: string;
  patient_name: string;
  patient_phone: string;
  status: string;
  completed_at: string;
  total_questions: number;
  answered_questions: number;
  questions: Question[];
  responses: Response[];
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
}

interface Questionnaire {
  id: string;
  title: string;
  description?: string;
  created_at: string;
}

interface Patient {
  id: string;
  medical_id: string;
  name: string;
  phone: string;
  latest_completion: string;
}

export default function PatientAnswersScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { session } = useAuth();
  const router = useRouter();
  const P = useMemo(() => getDoctorPalette(isDark), [isDark]);
  const styles = useMemo(() => makeStyles(P), [P]);
  const [answer, setAnswer] = useState<PatientAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');

  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null);
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);
  const [loadingQuestionnaires, setLoadingQuestionnaires] = useState(false);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientSearchText, setPatientSearchText] = useState('');

  const filteredDoctors = useMemo(() => {
    if (!doctorSearchQuery.trim()) {
      return doctors;
    }
    const query = doctorSearchQuery.toLowerCase().trim();
    return doctors.filter((doctor) =>
      (doctor.name?.toLowerCase() || '').includes(query) ||
      (doctor.specialization?.toLowerCase() || '').includes(query)
    );
  }, [doctors, doctorSearchQuery]);

  const loadDoctors = useCallback(async () => {
    setLoadingDoctors(true);
    try {
      const globalId = session?.user?.global_id;
      const companyId = session?.user?.company_id;
      if (!globalId) {
        console.error('No global_id found in session');
        return;
      }

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-accessible-doctors?global_id=${globalId}${companyId ? `&company_id=${companyId}` : ''}`,
        {
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch doctors');
      }

      const data = await response.json();
      const doctorsList = data.doctors || [];
      setDoctors(doctorsList);
    } catch (error) {
      console.error('Error loading doctors:', error);
    } finally {
      setLoadingDoctors(false);
    }
  }, [session?.user?.global_id, session?.user?.company_id]);

  const loadQuestionnaires = useCallback(async (doctorId: string) => {
    setLoadingQuestionnaires(true);
    try {
      const companyId = session?.user?.company_id;

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-doctor-questionnaires?doctor_id=${doctorId}${companyId ? `&company_id=${companyId}` : ''}`,
        {
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch questionnaires');
      }

      const data = await response.json();
      const questionnairesList = data.questionnaires || [];
      setQuestionnaires(questionnairesList);
    } catch (error) {
      console.error('Error loading questionnaires:', error);
    } finally {
      setLoadingQuestionnaires(false);
    }
  }, [session?.user?.company_id]);

  const loadPatients = useCallback(async (questionnaireId: string, doctorId: string) => {
    setLoadingPatients(true);
    try {
      const companyId = session?.user?.company_id;

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-questionnaire-patients?questionnaire_id=${questionnaireId}&doctor_id=${doctorId}${companyId ? `&company_id=${companyId}` : ''}`,
        {
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }

      const data = await response.json();
      const patientsList = data.patients || [];
      setPatients(patientsList);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoadingPatients(false);
    }
  }, [session?.user?.company_id]);

  const loadPatientAnswer = useCallback(async () => {
    if (!selectedQuestionnaire || !selectedPatient || !selectedDoctor) return;

    setLoading(true);
    try {
      const companyId = session?.user?.company_id;

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-patient-specific-answers?questionnaire_id=${selectedQuestionnaire.id}&patient_id=${selectedPatient.id}&doctor_id=${selectedDoctor.id}${companyId ? `&company_id=${companyId}` : ''}`,
        {
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (data.answer) {
        setAnswer(data.answer);
      }
    } catch (error) {
      console.error('Error loading patient answer:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedQuestionnaire, selectedPatient, selectedDoctor, session?.user?.company_id]);

  useEffect(() => {
    if (session?.user?.global_id) {
      loadDoctors();
    }
  }, [session?.user?.global_id, loadDoctors]);

  useEffect(() => {
    if (session?.user?.company_id) {
      setSelectedDoctor(null);
      setSelectedQuestionnaire(null);
      setSelectedPatient(null);
      setQuestionnaires([]);
      setPatients([]);
      setAnswer(null);
      loadDoctors();
    }
  }, [session?.user?.company_id, loadDoctors]);

  useEffect(() => {
    if (selectedDoctor) {
      loadQuestionnaires(selectedDoctor.id);
      setSelectedQuestionnaire(null);
      setSelectedPatient(null);
      setPatients([]);
      setAnswer(null);
    } else {
      setQuestionnaires([]);
      setSelectedQuestionnaire(null);
      setSelectedPatient(null);
      setPatients([]);
      setAnswer(null);
    }
  }, [selectedDoctor, loadQuestionnaires]);

  useEffect(() => {
    if (selectedQuestionnaire && selectedDoctor) {
      loadPatients(selectedQuestionnaire.id, selectedDoctor.id);
      setSelectedPatient(null);
      setAnswer(null);
    } else {
      setPatients([]);
      setSelectedPatient(null);
      setAnswer(null);
    }
  }, [selectedQuestionnaire, selectedDoctor, loadPatients]);

  useEffect(() => {
    if (selectedQuestionnaire && selectedPatient && selectedDoctor) {
      loadPatientAnswer();
    } else {
      setAnswer(null);
    }
  }, [selectedPatient, selectedQuestionnaire, selectedDoctor, loadPatientAnswer]);

  const onRefresh = () => {
    if (selectedQuestionnaire && selectedPatient && selectedDoctor) {
      setRefreshing(true);
      loadPatientAnswer();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getResponseValue = (question: Question, responses: Response[]) => {
    const response = responses.find(r => r.question_id === question.id);
    if (!response) return t('patientAnswers.noAnswer');

    switch (question.field_type) {
      case 'text':
      case 'textarea':
      case 'dropdown':
        return response.response_text || t('patientAnswers.noAnswer');
      case 'number':
        return response.response_number?.toString() || t('patientAnswers.noAnswer');
      case 'date':
        return response.response_date || t('patientAnswers.noAnswer');
      case 'boolean':
        return response.response_boolean ? t('common.yes') : t('common.no');
      case 'file':
        return response.response_file_url || t('patientAnswers.noFile');
      default:
        return t('patientAnswers.noAnswer');
    }
  };

  const renderSelectionCard = () => {
    const questionnaireDisabled = !selectedDoctor;
    const patientDisabled = !selectedQuestionnaire;
    return (
      <View style={styles.selectorCard}>
        <View style={styles.selectorCardHeader}>
          <View style={styles.selectorIconBubble}>
            <ClipboardList size={30} color={P.primary} strokeWidth={2} />
          </View>
          <View style={styles.selectorHeaderText}>
            <Text style={styles.selectorCardTitle}>{t('patientAnswers.selectContextTitle')}</Text>
            <Text style={styles.selectorCardSubtitle}>{t('patientAnswers.selectContextSubtitle')}</Text>
          </View>
        </View>

        {/* Doctor */}
        <Text style={styles.fieldLabel}>{t('patientAnswers.selectDoctor')}</Text>
        <TouchableOpacity
          style={styles.select}
          onPress={() => setShowDoctorModal(true)}
          activeOpacity={0.7}
        >
          <User size={20} color={P.textSecondary} />
          <Text
            style={[styles.selectText, { color: selectedDoctor ? P.text : P.placeholder }]}
            numberOfLines={1}
          >
            {selectedDoctor ? selectedDoctor.name : t('patientAnswers.chooseDoctor')}
          </Text>
          <ChevronDown size={20} color={P.chevron} />
        </TouchableOpacity>
        {selectedDoctor && !!selectedDoctor.specialization && (
          <Text style={styles.selectorSubtext}>{selectedDoctor.specialization}</Text>
        )}

        {/* Questionnaire */}
        <Text style={styles.fieldLabel}>{t('patientAnswers.selectQuestionnaire')}</Text>
        <TouchableOpacity
          style={[styles.select, questionnaireDisabled && styles.selectDisabled]}
          onPress={() => selectedDoctor && setShowQuestionnaireModal(true)}
          activeOpacity={0.7}
          disabled={questionnaireDisabled}
        >
          <ClipboardList size={20} color={questionnaireDisabled ? P.placeholder : P.textSecondary} />
          <Text
            style={[
              styles.selectText,
              { color: selectedQuestionnaire ? P.text : questionnaireDisabled ? P.placeholder : P.placeholder },
            ]}
            numberOfLines={1}
          >
            {selectedQuestionnaire ? selectedQuestionnaire.title : t('patientAnswers.chooseQuestionnaire')}
          </Text>
          <ChevronDown size={20} color={questionnaireDisabled ? P.placeholder : P.chevron} />
        </TouchableOpacity>
        {selectedQuestionnaire && !!selectedQuestionnaire.description && (
          <Text style={styles.selectorSubtext}>{selectedQuestionnaire.description}</Text>
        )}

        {/* Patient */}
        <Text style={styles.fieldLabel}>{t('patientAnswers.selectPatient')}</Text>
        <TouchableOpacity
          style={[styles.select, patientDisabled && styles.selectDisabled]}
          onPress={() => selectedQuestionnaire && setShowPatientModal(true)}
          activeOpacity={0.7}
          disabled={patientDisabled}
        >
          <User size={20} color={patientDisabled ? P.placeholder : P.textSecondary} />
          <Text
            style={[
              styles.selectText,
              { color: selectedPatient ? P.text : patientDisabled ? P.placeholder : P.placeholder },
            ]}
            numberOfLines={1}
          >
            {selectedPatient ? selectedPatient.name : t('patientAnswers.choosePatient')}
          </Text>
          <ChevronDown size={20} color={patientDisabled ? P.placeholder : P.chevron} />
        </TouchableOpacity>
        {selectedPatient && (
          <Text style={styles.selectorSubtext}>
            {t('patientAnswers.medicalIdLabel', { id: selectedPatient.medical_id })}
          </Text>
        )}
      </View>
    );
  };

  const renderDoctorModal = () => (
    <Modal
      visible={showDoctorModal}
      animationType="fade"
      transparent={true}
      onRequestClose={() => {
        setShowDoctorModal(false);
        setDoctorSearchQuery('');
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centeredOverlay}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => {
            setShowDoctorModal(false);
            setDoctorSearchQuery('');
          }}
        />
        <View style={[styles.centeredCard, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('patientAnswers.selectDoctor')}</Text>
            <TouchableOpacity onPress={() => {
              setShowDoctorModal(false);
              setDoctorSearchQuery('');
            }}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t('patientAnswers.searchDoctors')}
              placeholderTextColor={colors.textSecondary}
              value={doctorSearchQuery}
              onChangeText={setDoctorSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {doctorSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setDoctorSearchQuery('')}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {loadingDoctors ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {filteredDoctors.length === 0 ? (
                <View style={styles.modalEmpty}>
                  <Text style={[styles.modalEmptyText, { color: colors.textSecondary }]}>
                    {doctorSearchQuery.trim()
                      ? t('patientAnswers.noMatchingDoctors')
                      : t('patientAnswers.noDoctorsFound')}
                  </Text>
                </View>
              ) : (
                filteredDoctors.map((doctor) => (
                  <TouchableOpacity
                    key={doctor.id}
                    style={[
                      styles.modalItem,
                      selectedDoctor?.id === doctor.id && {
                        backgroundColor: `${colors.primary}15`,
                      },
                    ]}
                    onPress={() => {
                      setSelectedDoctor(doctor);
                      setShowDoctorModal(false);
                      setDoctorSearchQuery('');
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.modalItemContent}>
                      <Text style={[styles.modalItemText, { color: colors.text }]}>
                        {doctor.name}
                      </Text>
                      <Text style={[styles.modalItemSubtext, { color: colors.textSecondary }]}>
                        {doctor.specialization}
                      </Text>
                    </View>
                    {selectedDoctor?.id === doctor.id && (
                      <CheckCircle size={20} color={colors.primary} strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderQuestionnaireModal = () => (
    <Modal
      visible={showQuestionnaireModal}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setShowQuestionnaireModal(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centeredOverlay}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowQuestionnaireModal(false)}
        />
        <View style={[styles.centeredCard, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('patientAnswers.selectQuestionnaire')}</Text>
            <TouchableOpacity onPress={() => setShowQuestionnaireModal(false)}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {loadingQuestionnaires ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {questionnaires.length === 0 ? (
                <View style={styles.modalEmpty}>
                  <Text style={[styles.modalEmptyText, { color: colors.textSecondary }]}>
                    {t('patientAnswers.noQuestionnairesFound')}
                  </Text>
                </View>
              ) : (
                questionnaires.map((questionnaire) => (
                  <TouchableOpacity
                    key={questionnaire.id}
                    style={[
                      styles.modalItem,
                      selectedQuestionnaire?.id === questionnaire.id && {
                        backgroundColor: `${colors.primary}15`,
                      },
                    ]}
                    onPress={() => {
                      setSelectedQuestionnaire(questionnaire);
                      setShowQuestionnaireModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.modalItemContent}>
                      <Text style={[styles.modalItemText, { color: colors.text }]}>
                        {questionnaire.title}
                      </Text>
                      {questionnaire.description && (
                        <Text style={[styles.modalItemSubtext, { color: colors.textSecondary }]} numberOfLines={2}>
                          {questionnaire.description}
                        </Text>
                      )}
                    </View>
                    {selectedQuestionnaire?.id === questionnaire.id && (
                      <CheckCircle size={20} color={colors.primary} strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const filterPatients = () => {
    if (!patientSearchText.trim()) {
      return patients;
    }

    const searchLower = patientSearchText.toLowerCase();
    return patients.filter((patient) =>
      patient.name.toLowerCase().includes(searchLower) ||
      patient.medical_id.toLowerCase().includes(searchLower) ||
      patient.phone.includes(patientSearchText)
    );
  };

  const renderPatientModal = () => {
    const filteredPatients = filterPatients();

    return (
      <Modal
        visible={showPatientModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setShowPatientModal(false);
          setPatientSearchText('');
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.centeredOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowPatientModal(false);
              setPatientSearchText('');
            }}
          />
          <View style={[styles.centeredCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('patientAnswers.selectPatient')}</Text>
              <TouchableOpacity onPress={() => {
                setShowPatientModal(false);
                setPatientSearchText('');
              }}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <Search size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={t('patientAnswers.searchPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                value={patientSearchText}
                onChangeText={setPatientSearchText}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {patientSearchText.length > 0 && (
                <TouchableOpacity onPress={() => setPatientSearchText('')}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {loadingPatients ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
                {filteredPatients.length === 0 ? (
                  <View style={styles.modalEmpty}>
                    <Text style={[styles.modalEmptyText, { color: colors.textSecondary }]}>
                      {patientSearchText.trim()
                        ? t('patientAnswers.noPatientsMatchingSearch')
                        : t('patientAnswers.noPatientsCompleted')
                      }
                    </Text>
                  </View>
                ) : (
                  filteredPatients.map((patient) => (
                  <TouchableOpacity
                    key={patient.id}
                    style={[
                      styles.modalItem,
                      selectedPatient?.id === patient.id && {
                        backgroundColor: `${colors.primary}15`,
                      },
                    ]}
                    onPress={() => {
                      setSelectedPatient(patient);
                      setShowPatientModal(false);
                      setPatientSearchText('');
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.modalItemContent}>
                      <Text style={[styles.modalItemText, { color: colors.text }]}>
                        {patient.name}
                      </Text>
                      <Text style={[styles.modalItemSubtext, { color: colors.textSecondary }]}>
                        {t('patientAnswers.medicalIdLabel', { id: patient.medical_id })}
                      </Text>
                    </View>
                    {selectedPatient?.id === patient.id && (
                      <CheckCircle size={20} color={colors.primary} strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
    );
  };

  const renderAnswerCard = (answerData: PatientAnswer) => (
    <TouchableOpacity
      key={answerData.assignment_id}
      style={styles.answerCard}
      onPress={() => setShowDetailModal(true)}
      activeOpacity={0.7}
    >
      <View style={styles.answerHeader}>
        <View style={styles.answerIcon}>
          <FileText size={20} color={P.primary} />
        </View>
        <View style={styles.answerInfo}>
          <Text style={styles.answerTitle}>
            {answerData.questionnaire_title}
          </Text>
          <View style={styles.answerMeta}>
            <User size={14} color={P.textSecondary} />
            <Text style={styles.answerMetaText}>
              {answerData.patient_name}
            </Text>
          </View>
          <View style={styles.answerMeta}>
            <Calendar size={14} color={P.textSecondary} />
            <Text style={styles.answerMetaText}>
              {formatDate(answerData.completed_at)}
            </Text>
          </View>
        </View>
        <ChevronRight size={20} color={P.textSecondary} />
      </View>
      <View style={styles.answerFooter}>
        <View style={styles.badge}>
          <CheckCircle size={12} color={P.primary} />
          <Text style={styles.badgeText}>{t('patientAnswers.completed')}</Text>
        </View>
        <Text style={styles.responseCount}>
          {t('patientAnswers.answeredCount', { answered: answerData.answered_questions, total: answerData.total_questions })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderDetailModal = () => (
    <Modal
      visible={showDetailModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowDetailModal(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowDetailModal(false)}
        />
        <View style={[styles.detailModalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('patientAnswers.patientAnswersTitle')}</Text>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {answer && (
            <ScrollView style={styles.detailScrollView} showsVerticalScrollIndicator={false}>
              <View style={[styles.detailHeader, { backgroundColor: colors.inputBackground }]}>
                <View style={styles.detailPatientInfo}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('patientAnswers.patientLabel')}</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {answer.patient_name}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('patientAnswers.medicalIdRowLabel')}</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {answer.patient_medical_id}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('patientAnswers.completedLabel')}</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {formatDate(answer.completed_at)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.responsesContainer}>
                {answer.questions.map((question, index) => (
                  <View key={question.id} style={styles.responseItem}>
                    <View style={styles.questionHeader}>
                      <Text style={[styles.questionNumber, { color: colors.textTertiary }]}>
                        {t('patientAnswers.questionNumber', { number: index + 1 })}
                      </Text>
                    </View>
                    <Text style={[styles.questionText, { color: colors.text }]}>
                      {question.question_text}
                    </Text>
                    <View style={[styles.responseBox, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                      <Text style={[styles.responseText, { color: colors.text }]}>
                        {getResponseValue(question, answer.responses)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowDetailModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: P.pageBg }]} edges={['top']}>
      {/* Clean white mobile header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/(doctor-tabs)')}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={P.text} strokeWidth={2.2} />
        </TouchableOpacity>
        <View style={styles.headerIconCard}>
          <FileText size={26} color={P.primary} strokeWidth={2.2} />
        </View>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>{t('patientAnswers.headerTitle')}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{t('patientAnswers.headerSubtitle')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={P.primary} />
        }
      >
        {renderSelectionCard()}

        {!selectedDoctor || !selectedQuestionnaire || !selectedPatient ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyDashed}>
              <View style={styles.emptyIconCircle}>
                <FileText size={52} color={P.primary} strokeWidth={2} />
              </View>
              <Text style={styles.emptyTitle}>
                {!selectedDoctor ? t('patientAnswers.selectADoctorTitle') : !selectedQuestionnaire ? t('patientAnswers.selectAQuestionnaireTitle') : t('patientAnswers.selectAPatientTitle')}
              </Text>
              <Text style={styles.emptyDesc}>
                {!selectedDoctor
                  ? t('patientAnswers.selectADoctorText')
                  : !selectedQuestionnaire
                  ? t('patientAnswers.selectAQuestionnaireText')
                  : t('patientAnswers.selectAPatientText')}
              </Text>
            </View>
          </View>
        ) : loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={P.primary} />
            <Text style={styles.loadingText}>
              {t('patientAnswers.loadingPatientAnswers')}
            </Text>
          </View>
        ) : answer ? (
          renderAnswerCard(answer)
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyDashed}>
              <View style={styles.emptyIconCircle}>
                <FileText size={52} color={P.primary} strokeWidth={2} />
              </View>
              <Text style={styles.emptyTitle}>
                {t('patientAnswers.noAnswersFoundTitle')}
              </Text>
              <Text style={styles.emptyDesc}>
                {t('patientAnswers.noAnswersFoundText')}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {renderDoctorModal()}
      {renderQuestionnaireModal()}
      {renderPatientModal()}
      {renderDetailModal()}
    </SafeAreaView>
  );
}

const makeStyles = (P: DoctorPalette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.pageBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: P.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: P.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
  },
  backButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: 16,
  },
  headerIconCard: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.lightBlue,
    borderWidth: 1,
    borderColor: P.iconCardBorder,
    borderRadius: 16,
  },
  headerTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: P.text,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: P.textSecondary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 28,
  },

  // Select answer context card
  selectorCard: {
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.softBorder,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 3,
  },
  selectorCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  selectorIconBubble: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: P.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  selectorCardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: P.text,
  },
  selectorCardSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: P.textSecondary,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: P.text,
    marginTop: 18,
    marginBottom: 10,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 58,
    paddingHorizontal: 18,
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.inputBorder,
    borderRadius: 16,
  },
  selectDisabled: {
    backgroundColor: P.disabledBg,
    borderColor: P.border,
  },
  selectText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  selectorSubtext: {
    fontSize: 14,
    color: P.textSecondary,
    marginTop: 10,
    marginLeft: 2,
  },

  // Answer summary card
  answerCard: {
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 2,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 12,
  },
  answerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: P.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerInfo: {
    flex: 1,
    gap: 4,
  },
  answerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: P.text,
    marginBottom: 4,
  },
  answerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  answerMetaText: {
    fontSize: 13,
    color: P.textSecondary,
  },
  answerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: P.softBorder,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: P.lightBlue,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: P.primary,
  },
  responseCount: {
    fontSize: 13,
    color: P.textSecondary,
  },

  // Empty state card
  emptyCard: {
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.softBorder,
    borderRadius: 24,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 3,
  },
  emptyDashed: {
    backgroundColor: P.cardBg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: P.dashed,
    borderRadius: 22,
    minHeight: 420,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: P.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: P.text,
    textAlign: 'center',
    marginTop: 24,
  },
  emptyDesc: {
    fontSize: 16,
    fontWeight: '500',
    color: P.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 24,
  },
  loadingBox: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: P.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  centeredOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  centeredCard: {
    backgroundColor: P.cardBg,
    borderRadius: 24,
    width: '100%',
    maxWidth: 520,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: P.softBorder,
    overflow: 'hidden',
    paddingBottom: 34,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 12,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: P.overlay,
  },
  modalContent: {
    backgroundColor: P.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: P.softBorder,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: P.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  modalLoading: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: P.softBorder,
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: P.text,
    marginBottom: 2,
  },
  modalItemSubtext: {
    fontSize: 14,
    color: P.textSecondary,
  },
  modalEmpty: {
    paddingVertical: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 14,
    color: P.textSecondary,
    textAlign: 'center',
  },
  detailModalContent: {
    backgroundColor: P.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 34,
  },
  detailScrollView: {
    maxHeight: 600,
  },
  detailHeader: {
    padding: 20,
    backgroundColor: P.inputBg,
  },
  detailQuestionnaire: {
    fontSize: 18,
    fontWeight: '600',
    color: P.text,
    marginBottom: 16,
  },
  detailPatientInfo: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: P.textSecondary,
    minWidth: 90,
  },
  detailValue: {
    fontSize: 14,
    color: P.text,
    flex: 1,
  },
  responsesContainer: {
    padding: 20,
  },
  responseItem: {
    marginBottom: 24,
  },
  questionHeader: {
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: P.placeholder,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '500',
    color: P.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  responseBox: {
    backgroundColor: P.inputBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: P.border,
  },
  responseText: {
    fontSize: 15,
    color: P.text,
    lineHeight: 22,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  closeButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
