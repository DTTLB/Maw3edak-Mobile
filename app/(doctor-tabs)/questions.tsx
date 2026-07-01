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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { MessageCircle, Search, User, ChevronRight, ChevronDown, Check, X, AlertCircle, Plus, Edit2, Trash2, UserPlus, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { config } from '@/utils/config';
import { router } from 'expo-router';
import { getDoctorPalette, DoctorPalette } from '@/utils/doctorPalette';

interface Questionnaire {
  id: string;
  title: string;
  description: string | null;
  doctor_id: string;
  doctor_name: string;
  created_at: string;
  questions: Question[];
}

interface Question {
  id: string;
  question_text: string;
  field_type: string;
  is_required: boolean;
  order_index: number;
  options?: any;
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
}

export default function DoctorQuestionsScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const P = useMemo(() => getDoctorPalette(isDark), [isDark]);
  const styles = useMemo(() => makeStyles(P), [P]);
  const { session } = useAuth();
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedQuestionnaire, setExpandedQuestionnaire] = useState<string | null>(null);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');

  const filteredDoctors = useMemo(() => {
    if (!doctorSearchQuery.trim()) {
      return doctors;
    }
    const query = doctorSearchQuery.toLowerCase().trim();
    return doctors.filter(doctor =>
      (doctor.name?.toLowerCase() || '').includes(query) ||
      (doctor.specialization?.toLowerCase() || '').includes(query)
    );
  }, [doctors, doctorSearchQuery]);

  // Modal states
  const [showCreateQuestionnaireModal, setShowCreateQuestionnaireModal] = useState(false);
  const [showEditQuestionnaireModal, setShowEditQuestionnaireModal] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Assign states
  const [assigningQuestionnaire, setAssigningQuestionnaire] = useState<Questionnaire | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [assignedMedicalIds, setAssignedMedicalIds] = useState<Set<string>>(new Set());
  const [, setCurrentAssignments] = useState<Set<string>>(new Set());
  const [patientSearchQuery, setPatientSearchQuery] = useState('');

  // Form states
  const [editingQuestionnaire, setEditingQuestionnaire] = useState<Questionnaire | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [activeQuestionnaireId, setActiveQuestionnaireId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    questionText: '',
    fieldType: 'text',
    isRequired: false,
  });

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
    setLoading(true);
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

      const data = await response.json();
      if (data.questionnaires) {
        setQuestionnaires(data.questionnaires);
      }
    } catch (error) {
      console.error('Error loading questionnaires:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.user?.company_id]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  useEffect(() => {
    if (session?.user?.company_id) {
      setSelectedDoctor(null);
      setQuestionnaires([]);
      loadDoctors();
    }
  }, [session?.user?.company_id, loadDoctors]);

  useEffect(() => {
    if (selectedDoctor) {
      loadQuestionnaires(selectedDoctor.id);
    } else {
      setQuestionnaires([]);
    }
  }, [selectedDoctor, loadQuestionnaires]);

  const onRefresh = () => {
    if (selectedDoctor) {
      setRefreshing(true);
      loadQuestionnaires(selectedDoctor.id);
    }
  };

  const getFieldTypeLabel = (fieldType: string): string => {
    const typeMap: { [key: string]: string } = {
      text: t('questions.fieldTypeText'),
      number: t('questions.fieldTypeNumber'),
      boolean: t('questions.fieldTypeBoolean'),
      date: t('questions.fieldTypeDate'),
      select: t('questions.fieldTypeSelect'),
      multiselect: t('questions.fieldTypeMultiselect'),
      textarea: t('questions.fieldTypeTextarea'),
    };
    return typeMap[fieldType] || fieldType;
  };

  const getFieldTypeColor = (fieldType: string): string => {
    const colorMap: { [key: string]: string } = {
      text: '#2D7DD2',
      number: '#15C2B0',
      boolean: '#F59E0B',
      date: '#2D7DD2',
      select: '#FF6F61',
      multiselect: '#2D7DD2',
      textarea: '#15C2B0',
    };
    return colorMap[fieldType] || P.textSecondary;
  };

  // Delete Questionnaire
  const handleDeleteQuestionnaire = async (questionnaire: Questionnaire) => {
    console.log('handleDeleteQuestionnaire called for:', questionnaire.title);

    const confirmed = Platform.OS === 'web'
      ? window.confirm(t('questions.deleteQuestionnaireMessage', { title: questionnaire.title }))
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            t('questions.deleteQuestionnaireTitle'),
            t('questions.deleteQuestionnaireMessage', { title: questionnaire.title }),
            [
              { text: t('common.cancel'), style: 'cancel', onPress: () => resolve(false) },
              { text: t('common.delete'), style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });

    console.log('Confirmation result:', confirmed);
    if (!confirmed) {
      console.log('Deletion cancelled');
      return;
    }
    console.log('Proceeding with deletion...');

    try {
      setActionLoading(true);
      console.log('Deleting questionnaire:', questionnaire.id);

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-delete-questionnaire?questionnaire_id=${questionnaire.id}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Delete response status:', response.status);

      const responseText = await response.text();
      console.log('Delete response text:', responseText);

      if (!response.ok) {
        let errorMsg = t('questions.failedToDeleteQuestionnaire');
        try {
          const errorData = JSON.parse(responseText);
          errorMsg = errorData.error || errorData.details || errorMsg;
        } catch {
          errorMsg = responseText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      setQuestionnaires(prev => prev.filter(q => q.id !== questionnaire.id));
      if (Platform.OS === 'web') {
        window.alert(t('questions.questionnaireDeletedSuccess'));
      } else {
        Alert.alert(t('common.success'), t('questions.questionnaireDeletedSuccess'));
      }
    } catch (error) {
      console.error('Error deleting questionnaire:', error);
      const errorMsg = error instanceof Error ? error.message : t('questions.failedToDeleteQuestionnaire');
      if (Platform.OS === 'web') {
        window.alert(t('questions.errorPrefix', { message: errorMsg }));
      } else {
        Alert.alert(t('common.error'), errorMsg);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (question: Question, questionnaireId: string) => {
    console.log('handleDeleteQuestion called for:', question.question_text);

    const confirmed = Platform.OS === 'web'
      ? window.confirm(t('questions.deleteQuestionMessage'))
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            t('questions.deleteQuestionTitle'),
            t('questions.deleteQuestionMessage'),
            [
              { text: t('common.cancel'), style: 'cancel', onPress: () => resolve(false) },
              { text: t('common.delete'), style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });

    console.log('Confirmation result:', confirmed);
    if (!confirmed) {
      console.log('Deletion cancelled');
      return;
    }
    console.log('Proceeding with deletion...');

    try {
      setActionLoading(true);
      console.log('Deleting question:', question.id);

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-delete-question?question_id=${question.id}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Delete question response status:', response.status);

      const responseText = await response.text();
      console.log('Delete question response text:', responseText);

      if (!response.ok) {
        let errorMsg = t('questions.failedToDeleteQuestion');
        try {
          const errorData = JSON.parse(responseText);
          errorMsg = errorData.error || errorData.details || errorMsg;
        } catch {
          errorMsg = responseText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      setQuestionnaires(prev =>
        prev.map(q =>
          q.id === questionnaireId
            ? { ...q, questions: q.questions.filter(quest => quest.id !== question.id) }
            : q
        )
      );
      if (Platform.OS === 'web') {
        window.alert(t('questions.questionDeletedSuccess'));
      } else {
        Alert.alert(t('common.success'), t('questions.questionDeletedSuccess'));
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      const errorMsg = error instanceof Error ? error.message : t('questions.failedToDeleteQuestion');
      if (Platform.OS === 'web') {
        window.alert(t('questions.errorPrefix', { message: errorMsg }));
      } else {
        Alert.alert(t('common.error'), errorMsg);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Assign Questionnaire to Patients
  const openAssignModal = async (questionnaire: Questionnaire) => {
    setAssigningQuestionnaire(questionnaire);
    setPatientSearchQuery('');
    setShowAssignModal(true);
    await loadPatientsWithAssignments(questionnaire.id);
  };

  const loadPatientsWithAssignments = async (questionnaireId: string) => {
    if (!selectedDoctor) return;

    setLoadingPatients(true);
    try {
      const globalId = session?.user?.global_id;
      const companyId = session?.user?.company_id;

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-doctor-patients?global_id=${globalId}&doctor_id=${selectedDoctor.id}${companyId ? `&company_id=${companyId}` : ''}`,
        {
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);

        const assignmentsResponse = await fetch(
          `${config.supabaseUrl}/functions/v1/mobile-get-doctor-questionnaires?doctor_id=${selectedDoctor.id}${companyId ? `&company_id=${companyId}` : ''}`,
          {
            headers: {
              'Authorization': `Bearer ${config.supabaseAnonKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (assignmentsResponse.ok) {
          const assignmentsResult = await assignmentsResponse.json();
          const assignments = assignmentsResult.questionnaires || [];
          const targetQuestionnaire = assignments.find((q: any) => q.id === questionnaireId);

          if (targetQuestionnaire && targetQuestionnaire.assigned_patients) {
            const assigned = new Set<string>(targetQuestionnaire.assigned_patients);
            setAssignedMedicalIds(assigned);
            setCurrentAssignments(new Set(assigned));
          } else {
            setAssignedMedicalIds(new Set());
            setCurrentAssignments(new Set());
          }
        }
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleDirectAssign = async (medicalId: string) => {
    if (!assigningQuestionnaire || !selectedDoctor) return;

    try {
      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-assign-questionnaire`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questionnaire_id: assigningQuestionnaire.id,
            doctor_id: selectedDoctor.id,
            patient_medical_ids: [medicalId],
            company_id: session?.user?.company_id,
            assigned_by_user_id: session?.user?.id,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('questions.failedToAssign'));
      }

      // Update local state immediately
      const newAssignments = new Set(assignedMedicalIds);
      newAssignments.add(medicalId);
      setAssignedMedicalIds(newAssignments);
      setCurrentAssignments(newAssignments);
    } catch (error) {
      console.error('Error assigning questionnaire:', error);
      const errorMsg = error instanceof Error ? error.message : t('questions.failedToAssign');
      if (Platform.OS === 'web') {
        window.alert(t('questions.errorPrefix', { message: errorMsg }));
      } else {
        Alert.alert(t('common.error'), errorMsg);
      }
    }
  };

  const handleDirectUnassign = async (medicalId: string) => {
    if (!assigningQuestionnaire || !selectedDoctor) return;

    try {
      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-unassign-questionnaire`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questionnaire_id: assigningQuestionnaire.id,
            doctor_id: selectedDoctor.id,
            patient_medical_ids: [medicalId],
            company_id: session?.user?.company_id,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('questions.failedToUnassign'));
      }

      // Update local state immediately
      const newAssignments = new Set(assignedMedicalIds);
      newAssignments.delete(medicalId);
      setAssignedMedicalIds(newAssignments);
      setCurrentAssignments(newAssignments);
    } catch (error) {
      console.error('Error unassigning questionnaire:', error);
      const errorMsg = error instanceof Error ? error.message : t('questions.failedToUnassign');
      if (Platform.OS === 'web') {
        window.alert(t('questions.errorPrefix', { message: errorMsg }));
      } else {
        Alert.alert(t('common.error'), errorMsg);
      }
    }
  };

  const filteredPatients = patients.filter((patient) => {
    if (!patientSearchQuery.trim()) return true;
    const query = patientSearchQuery.toLowerCase();
    return (
      patient.full_name.toLowerCase().includes(query) ||
      patient.medical_id.toLowerCase().includes(query)
    );
  });


  // Edit Questionnaire
  const openEditQuestionnaire = (questionnaire: Questionnaire) => {
    setEditingQuestionnaire(questionnaire);
    setFormData({
      ...formData,
      title: questionnaire.title,
      description: questionnaire.description || '',
    });
    setShowEditQuestionnaireModal(true);
  };

  const handleEditQuestionnaire = async () => {
    if (!editingQuestionnaire || !formData.title.trim()) {
      Alert.alert(t('common.error'), t('questions.errorPleaseEnterTitle'));
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-update-questionnaire`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questionnaire_id: editingQuestionnaire.id,
            title: formData.title.trim(),
            description: formData.description.trim() || null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(t('questions.failedToUpdateQuestionnaire'));
      }

      const data = await response.json();
      setQuestionnaires(prev =>
        prev.map(q =>
          q.id === editingQuestionnaire.id
            ? { ...q, title: data.questionnaire.title, description: data.questionnaire.description }
            : q
        )
      );

      setShowEditQuestionnaireModal(false);
      setEditingQuestionnaire(null);
      setFormData({ title: '', description: '', questionText: '', fieldType: 'text', isRequired: false });
      Alert.alert(t('common.success'), t('questions.questionnaireUpdatedSuccess'));
    } catch (error) {
      console.error('Error updating questionnaire:', error);
      Alert.alert(t('common.error'), t('questions.failedToUpdateQuestionnaire'));
    } finally {
      setActionLoading(false);
    }
  };

  // Add Question
  const openAddQuestion = (questionnaireId: string) => {
    setActiveQuestionnaireId(questionnaireId);
    setFormData({ ...formData, questionText: '', fieldType: 'text', isRequired: false });
    setShowAddQuestionModal(true);
  };

  const handleAddQuestion = async () => {
    if (!activeQuestionnaireId || !formData.questionText.trim()) {
      Alert.alert(t('common.error'), t('questions.errorPleaseEnterQuestionText'));
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-add-question`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questionnaire_id: activeQuestionnaireId,
            question_text: formData.questionText.trim(),
            field_type: formData.fieldType,
            is_required: formData.isRequired,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(t('questions.failedToAddQuestion'));
      }

      const data = await response.json();
      setQuestionnaires(prev =>
        prev.map(q =>
          q.id === activeQuestionnaireId
            ? { ...q, questions: [...q.questions, data.question] }
            : q
        )
      );

      setShowAddQuestionModal(false);
      setActiveQuestionnaireId(null);
      setFormData({ title: '', description: '', questionText: '', fieldType: 'text', isRequired: false });
      Alert.alert(t('common.success'), t('questions.questionAddedSuccess'));
    } catch (error) {
      console.error('Error adding question:', error);
      Alert.alert(t('common.error'), t('questions.failedToAddQuestion'));
    } finally {
      setActionLoading(false);
    }
  };

  // Edit Question
  const openEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      ...formData,
      questionText: question.question_text,
      fieldType: question.field_type,
      isRequired: question.is_required,
    });
    setShowEditQuestionModal(true);
  };

  const handleEditQuestion = async () => {
    if (!editingQuestion || !formData.questionText.trim()) {
      Alert.alert(t('common.error'), t('questions.errorPleaseEnterQuestionText'));
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-update-question`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question_id: editingQuestion.id,
            question_text: formData.questionText.trim(),
            field_type: formData.fieldType,
            is_required: formData.isRequired,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(t('questions.failedToUpdateQuestion'));
      }

      const data = await response.json();
      setQuestionnaires(prev =>
        prev.map(q => ({
          ...q,
          questions: q.questions.map(quest =>
            quest.id === editingQuestion.id ? data.question : quest
          ),
        }))
      );

      setShowEditQuestionModal(false);
      setEditingQuestion(null);
      setFormData({ title: '', description: '', questionText: '', fieldType: 'text', isRequired: false });
      Alert.alert(t('common.success'), t('questions.questionUpdatedSuccess'));
    } catch (error) {
      console.error('Error updating question:', error);
      Alert.alert(t('common.error'), t('questions.failedToUpdateQuestion'));
    } finally {
      setActionLoading(false);
    }
  };

  // Create Questionnaire
  const openCreateQuestionnaire = () => {
    setFormData({ title: '', description: '', questionText: '', fieldType: 'text', isRequired: false });
    setShowCreateQuestionnaireModal(true);
  };

  const handleCreateQuestionnaire = async () => {
    if (!formData.title.trim() || !selectedDoctor) {
      Alert.alert(t('common.error'), t('questions.errorPleaseEnterTitle'));
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-create-questionnaire`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            doctor_id: selectedDoctor.id,
            company_id: session?.user?.company_id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(t('questions.failedToCreateQuestionnaire'));
      }

      if (selectedDoctor) {
        loadQuestionnaires(selectedDoctor.id);
      }

      setShowCreateQuestionnaireModal(false);
      setFormData({ title: '', description: '', questionText: '', fieldType: 'text', isRequired: false });
      Alert.alert(t('common.success'), t('questions.questionnaireCreatedSuccess'));
    } catch (error) {
      console.error('Error creating questionnaire:', error);
      Alert.alert(t('common.error'), t('questions.failedToCreateQuestionnaire'));
    } finally {
      setActionLoading(false);
    }
  };

  // Reusable Form Modal
  const renderFormModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    fields: { label: string; key: string; placeholder: string; required?: boolean; multiline?: boolean }[],
    onSubmit: () => void,
    isCreate: boolean = false
  ) => (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.formModalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScrollView} showsVerticalScrollIndicator={false}>
            {fields.map((field) => (
              <View key={field.key} style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>
                  {field.label}
                  {field.required && <Text style={styles.requiredAsterisk}> *</Text>}
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    field.multiline && styles.formTextArea,
                    { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }
                  ]}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.textTertiary}
                  value={formData[field.key as keyof typeof formData] as string}
                  onChangeText={(text) => setFormData({ ...formData, [field.key]: text })}
                  multiline={field.multiline}
                  numberOfLines={field.multiline ? 4 : 1}
                />
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary, { backgroundColor: colors.inputBackground }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.modalButtonText, { color: colors.text }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: colors.primary }]}
              onPress={onSubmit}
              disabled={actionLoading}
              activeOpacity={0.7}
            >
              {actionLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  {isCreate ? t('questions.create') : t('common.save')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // Question Modal with Field Type Selector
  const renderQuestionModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    onSubmit: () => void,
    isAdd: boolean = false
  ) => (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.formModalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>
                {t('questions.questionTextLabel')} <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.formInput,
                  styles.formTextArea,
                  { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }
                ]}
                placeholder={t('questions.questionTextPlaceholder')}
                placeholderTextColor={colors.textTertiary}
                value={formData.questionText}
                onChangeText={(text) => setFormData({ ...formData, questionText: text })}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>{t('questions.fieldTypeLabel')}</Text>
              <View style={styles.fieldTypeGrid}>
                {['text', 'number', 'boolean', 'date', 'select', 'multiselect', 'textarea'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.fieldTypeOption,
                      formData.fieldType === type && { backgroundColor: `${getFieldTypeColor(type)}20`, borderColor: getFieldTypeColor(type) },
                      { borderColor: formData.fieldType === type ? getFieldTypeColor(type) : colors.border }
                    ]}
                    onPress={() => setFormData({ ...formData, fieldType: type })}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.fieldTypeOptionText,
                        { color: formData.fieldType === type ? getFieldTypeColor(type) : colors.textSecondary }
                      ]}
                    >
                      {getFieldTypeLabel(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setFormData({ ...formData, isRequired: !formData.isRequired })}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, { borderColor: colors.border }, formData.isRequired && { backgroundColor: colors.primary }]}>
                  {formData.isRequired && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={[styles.checkboxLabel, { color: colors.text }]}>{t('questions.requiredQuestion')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary, { backgroundColor: colors.inputBackground }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.modalButtonText, { color: colors.text }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: colors.primary }]}
              onPress={onSubmit}
              disabled={actionLoading}
              activeOpacity={0.7}
            >
              {actionLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  {isAdd ? t('questions.add') : t('common.save')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderDoctorSelector = () => (
    <View style={styles.selectorCard}>
      <View style={styles.selectorCardHeader}>
        <View style={styles.selectorIconBubble}>
          <User size={28} color={P.primary} strokeWidth={2} />
        </View>
        <View style={styles.selectorHeaderText}>
          <Text style={styles.selectorCardTitle}>{t('questions.selectDoctorCardTitle')}</Text>
          <Text style={styles.selectorCardSubtitle}>{t('questions.selectDoctorCardSubtitle')}</Text>
        </View>
      </View>

      <Text style={styles.fieldLabel}>{t('questions.selectDoctorLabel')}</Text>
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
          {selectedDoctor ? selectedDoctor.name : t('questions.chooseDoctor')}
        </Text>
        <ChevronDown size={20} color={P.chevron} />
      </TouchableOpacity>
      {selectedDoctor && !!selectedDoctor.specialization && (
        <Text style={styles.selectorSubtext}>{selectedDoctor.specialization}</Text>
      )}
    </View>
  );

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
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('questions.selectDoctorModalTitle')}</Text>
            <TouchableOpacity onPress={() => {
              setShowDoctorModal(false);
              setDoctorSearchQuery('');
            }}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.modalSearchContainer, { backgroundColor: colors.background }]}>
            <Search size={18} color={colors.textTertiary} />
            <TextInput
              style={[styles.modalSearchInput, { color: colors.text }]}
              placeholder={t('questions.searchDoctors')}
              placeholderTextColor={colors.textTertiary}
              value={doctorSearchQuery}
              onChangeText={setDoctorSearchQuery}
            />
            {doctorSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setDoctorSearchQuery('')} style={styles.clearButton}>
                <X size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          {loadingDoctors ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : filteredDoctors.length === 0 ? (
            <View style={styles.modalLoading}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {doctorSearchQuery ? t('questions.noMatchingDoctors') : t('questions.selectDoctorEmptyTitle')}
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.modalList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              {filteredDoctors.map((doctor) => (
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
                    <Check size={20} color={colors.primary} strokeWidth={3} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderQuestionnaireCard = (questionnaire: Questionnaire) => {
    const isExpanded = expandedQuestionnaire === questionnaire.id;

    return (
      <View key={questionnaire.id} style={styles.questionnaireCard}>
        <TouchableOpacity
          style={styles.questionnaireHeader}
          onPress={() => setExpandedQuestionnaire(isExpanded ? null : questionnaire.id)}
          activeOpacity={0.7}
        >
          <View style={styles.questionnaireHeaderLeft}>
            <View style={styles.questionnaireIcon}>
              <MessageCircle size={20} color={P.primary} />
            </View>
            <View style={styles.questionnaireInfo}>
              <Text style={styles.questionnaireTitle}>
                {questionnaire.title}
              </Text>
              <Text style={styles.questionnaireSubtitle}>
                {t('questions.questionCount', { count: questionnaire.questions.length })}
              </Text>
            </View>
          </View>
          <View style={styles.questionnaireActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#EAF3FC' }]}
              onPress={(e) => {
                e.stopPropagation();
                openAssignModal(questionnaire);
              }}
              activeOpacity={0.7}
            >
              <UserPlus size={16} color="#2D7DD2" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: P.lightBlue }]}
              onPress={(e) => {
                e.stopPropagation();
                openEditQuestionnaire(questionnaire);
              }}
              activeOpacity={0.7}
            >
              <Edit2 size={16} color={P.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#FFEDEB' }]}
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteQuestionnaire(questionnaire);
              }}
              activeOpacity={0.7}
            >
              <Trash2 size={16} color="#FF6F61" />
            </TouchableOpacity>
            <ChevronRight
              size={20}
              color={P.textSecondary}
              style={{
                transform: [{ rotate: isExpanded ? '90deg' : '0deg' }],
              }}
            />
          </View>
        </TouchableOpacity>

        {questionnaire.description && (
          <Text style={styles.questionnaireDescription}>
            {questionnaire.description}
          </Text>
        )}

        {isExpanded && (
          <View style={styles.questionsContainer}>
            <View style={styles.questionsDivider} />
            {questionnaire.questions
              .sort((a, b) => a.order_index - b.order_index)
              .map((question, index) => (
                <View key={question.id} style={styles.questionItem}>
                  <View style={styles.questionHeaderRow}>
                    <View style={styles.questionHeader}>
                      <Text style={styles.questionNumber}>
                        {t('questions.questionNumber', { number: index + 1 })}
                      </Text>
                      {question.is_required && (
                        <View style={[styles.requiredBadge, { backgroundColor: '#FEF3C7' }]}>
                          <AlertCircle size={12} color="#F59E0B" />
                          <Text style={styles.requiredText}>{t('questions.requiredBadge')}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.questionActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: P.lightBlue }]}
                        onPress={() => openEditQuestion(question)}
                        activeOpacity={0.7}
                      >
                        <Edit2 size={14} color={P.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#FFEDEB' }]}
                        onPress={() => handleDeleteQuestion(question, questionnaire.id)}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={14} color="#FF6F61" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.questionText}>
                    {question.question_text}
                  </Text>
                  <View style={styles.fieldTypeBadge}>
                    <Text style={styles.fieldTypeText}>
                      {getFieldTypeLabel(question.field_type)}
                    </Text>
                  </View>
                </View>
              ))}
            <TouchableOpacity
              style={styles.addQuestionButton}
              onPress={() => openAddQuestion(questionnaire.id)}
              activeOpacity={0.7}
            >
              <Plus size={16} color={P.primary} />
              <Text style={styles.addQuestionText}>
                {t('questions.addQuestion')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.questionnaireFooter}>
          <Text style={styles.questionnaireDate}>
            {t('questions.createdDate', { date: new Date(questionnaire.created_at).toLocaleDateString() })}
          </Text>
        </View>
      </View>
    );
  };

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
          <MessageCircle size={26} color={P.primary} strokeWidth={2.2} />
        </View>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>{t('questions.headerTitle')}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{t('questions.headerSubtitle')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={P.primary} />
        }
      >
        {renderDoctorSelector()}

        {!selectedDoctor ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyDashed}>
              <View style={styles.emptyIconCircle}>
                <MessageCircle size={48} color={P.primary} strokeWidth={2} />
              </View>
              <Text style={styles.emptyTitle}>{t('questions.selectDoctorEmptyTitle')}</Text>
              <Text style={styles.emptyDesc}>{t('questions.selectDoctorEmptyText')}</Text>
            </View>
          </View>
        ) : loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={P.primary} />
            <Text style={styles.loadingText}>{t('questions.loadingQuestionnaires')}</Text>
          </View>
        ) : questionnaires.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyDashed}>
              <View style={styles.emptyIconCircle}>
                <MessageCircle size={48} color={P.primary} strokeWidth={2} />
              </View>
              <Text style={styles.emptyTitle}>{t('questions.noQuestionnairesTitle')}</Text>
              <Text style={styles.emptyDesc}>{t('questions.noQuestionnairesText')}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.questionnairesList}>
            {questionnaires.map((questionnaire) => renderQuestionnaireCard(questionnaire))}
          </View>
        )}
      </ScrollView>

      {renderDoctorModal()}

      {selectedDoctor && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={openCreateQuestionnaire}
          activeOpacity={0.9}
        >
          <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      )}

      {/* Create Questionnaire Modal */}
      {renderFormModal(
        showCreateQuestionnaireModal,
        () => setShowCreateQuestionnaireModal(false),
        t('questions.createQuestionnaireTitle'),
        [
          { label: t('questions.titleLabel'), key: 'title', placeholder: t('questions.titlePlaceholder'), required: true },
          { label: t('questions.descriptionLabel'), key: 'description', placeholder: t('questions.descriptionPlaceholder'), multiline: true },
        ],
        handleCreateQuestionnaire,
        true
      )}

      {/* Edit Questionnaire Modal */}
      {renderFormModal(
        showEditQuestionnaireModal,
        () => {
          setShowEditQuestionnaireModal(false);
          setEditingQuestionnaire(null);
        },
        t('questions.editQuestionnaireTitle'),
        [
          { label: t('questions.titleLabel'), key: 'title', placeholder: t('questions.titlePlaceholder'), required: true },
          { label: t('questions.descriptionLabel'), key: 'description', placeholder: t('questions.descriptionPlaceholder'), multiline: true },
        ],
        handleEditQuestionnaire
      )}

      {/* Add Question Modal */}
      {renderQuestionModal(
        showAddQuestionModal,
        () => {
          setShowAddQuestionModal(false);
          setActiveQuestionnaireId(null);
        },
        t('questions.addQuestionTitle'),
        handleAddQuestion,
        true
      )}

      {/* Edit Question Modal */}
      {renderQuestionModal(
        showEditQuestionModal,
        () => {
          setShowEditQuestionModal(false);
          setEditingQuestion(null);
        },
        t('questions.editQuestionTitle'),
        handleEditQuestion
      )}

      {/* Assign Questionnaire Modal */}
      <Modal
        visible={showAssignModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAssignModal(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setShowAssignModal(false)}
            />
            <View style={[styles.assignModalContentWrapper, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {t('questions.manageAssignmentsTitle')}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAssignModal(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {assigningQuestionnaire && (
                <View style={[styles.assignInfoCard, { backgroundColor: colors.card }]}>
                  <Text style={[styles.assignInfoTitle, { color: colors.text }]}>
                    {assigningQuestionnaire.title}
                  </Text>
                  <Text style={[styles.assignInfoSubtitle, { color: colors.textSecondary }]}>
                    {t('questions.assignInfoSubtitle')}
                  </Text>
                </View>
              )}

              <View style={styles.searchContainer}>
                <View style={[styles.searchInputWrapper, { backgroundColor: colors.card }]}>
                  <Search size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder={t('questions.searchPatientsPlaceholder')}
                    placeholderTextColor={colors.textSecondary}
                    value={patientSearchQuery}
                    onChangeText={setPatientSearchQuery}
                  />
                  {patientSearchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setPatientSearchQuery('')}>
                      <X size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <ScrollView style={styles.assignModalScroll}>
                {loadingPatients ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                      {t('questions.loadingPatients')}
                    </Text>
                  </View>
                ) : filteredPatients.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      {patientSearchQuery.trim()
                        ? t('questions.noPatientsMatchSearch')
                        : t('questions.noPatientsForDoctor')}
                    </Text>
                  </View>
                ) : (
                  <>
                    {/* Assigned Patients Section */}
                    {filteredPatients.filter(p => assignedMedicalIds.has(p.medical_id)).length > 0 && (
                      <View style={styles.patientSection}>
                        <View style={[styles.sectionHeader, { backgroundColor: '#E4F8F4' }]}>
                          <Text style={[styles.sectionTitle, { color: '#0FA295' }]}>
                            {t('questions.assignedPatients', { count: filteredPatients.filter(p => assignedMedicalIds.has(p.medical_id)).length })}
                          </Text>
                        </View>
                        {filteredPatients
                          .filter(patient => assignedMedicalIds.has(patient.medical_id))
                          .map((patient) => (
                            <TouchableOpacity
                              key={patient.medical_id}
                              style={[
                                styles.patientItem,
                                {
                                  backgroundColor: '#E4F8F4',
                                  borderColor: '#15C2B0',
                                  borderWidth: 1,
                                },
                              ]}
                              onPress={() => handleDirectUnassign(patient.medical_id)}
                              activeOpacity={0.7}
                            >
                              <View style={styles.patientInfo}>
                                <View style={[styles.patientIcon, { backgroundColor: '#D4F3EE' }]}>
                                  <User size={20} color="#15C2B0" />
                                </View>
                                <View style={styles.patientDetails}>
                                  <Text style={[styles.patientName, { color: colors.text }]}>
                                    {patient.full_name}
                                  </Text>
                                  <Text style={[styles.patientId, { color: colors.textSecondary }]}>
                                    {patient.medical_id}
                                  </Text>
                                </View>
                              </View>
                              <TouchableOpacity
                                style={[styles.toggleButton, { backgroundColor: '#FF6F61' }]}
                                onPress={() => handleDirectUnassign(patient.medical_id)}
                                activeOpacity={0.7}
                              >
                                <X size={16} color="#FFFFFF" strokeWidth={2.5} />
                              </TouchableOpacity>
                            </TouchableOpacity>
                          ))}
                      </View>
                    )}

                    {/* Unassigned Patients Section */}
                    {filteredPatients.filter(p => !assignedMedicalIds.has(p.medical_id)).length > 0 && (
                      <View style={styles.patientSection}>
                        <View style={[styles.sectionHeader, { backgroundColor: '#F3F4F6' }]}>
                          <Text style={[styles.sectionTitle, { color: '#374151' }]}>
                            {t('questions.unassignedPatients', { count: filteredPatients.filter(p => !assignedMedicalIds.has(p.medical_id)).length })}
                          </Text>
                        </View>
                        {filteredPatients
                          .filter(patient => !assignedMedicalIds.has(patient.medical_id))
                          .map((patient) => (
                            <TouchableOpacity
                              key={patient.medical_id}
                              style={[
                                styles.patientItem,
                                { backgroundColor: colors.card },
                              ]}
                              onPress={() => handleDirectAssign(patient.medical_id)}
                              activeOpacity={0.7}
                            >
                              <View style={styles.patientInfo}>
                                <View style={[styles.patientIcon, { backgroundColor: `${colors.primary}15` }]}>
                                  <User size={20} color={colors.primary} />
                                </View>
                                <View style={styles.patientDetails}>
                                  <Text style={[styles.patientName, { color: colors.text }]}>
                                    {patient.full_name}
                                  </Text>
                                  <Text style={[styles.patientId, { color: colors.textSecondary }]}>
                                    {patient.medical_id}
                                  </Text>
                                </View>
                              </View>
                              <TouchableOpacity
                                style={[styles.toggleButton, { backgroundColor: colors.primary }]}
                                onPress={() => handleDirectAssign(patient.medical_id)}
                                activeOpacity={0.7}
                              >
                                <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
                              </TouchableOpacity>
                            </TouchableOpacity>
                          ))}
                      </View>
                    )}
                  </>
                )}
              </ScrollView>

              <View style={styles.assignModalFooter}>
                <TouchableOpacity
                  style={[styles.assignCloseButton, { backgroundColor: colors.primary }]}
                  onPress={() => setShowAssignModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.assignCloseButtonText, { color: '#FFFFFF' }]}>
                    {t('common.close')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

  // Select doctor card
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
    marginTop: 24,
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
    minHeight: 460,
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
  questionnairesList: {
    gap: 16,
  },
  questionnaireCard: {
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 2,
    overflow: 'hidden',
  },
  questionnaireHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  questionnaireHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  questionnaireIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: P.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionnaireInfo: {
    flex: 1,
  },
  questionnaireTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: P.text,
    marginBottom: 2,
  },
  questionnaireSubtitle: {
    fontSize: 14,
    color: P.textSecondary,
  },
  questionnaireDescription: {
    fontSize: 14,
    color: P.textSecondary,
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  questionsContainer: {
    paddingBottom: 8,
  },
  questionsDivider: {
    height: 1,
    backgroundColor: P.softBorder,
    marginBottom: 12,
  },
  questionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: P.textSecondary,
  },
  requiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  requiredText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
  },
  questionText: {
    fontSize: 15,
    fontWeight: '600',
    color: P.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  fieldTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: P.lightBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  fieldTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: P.primary,
  },
  questionnaireFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: P.softBorder,
  },
  questionnaireDate: {
    fontSize: 13,
    color: P.textSecondary,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateCard: {
    backgroundColor: P.cardBg,
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: P.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: P.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
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
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: P.overlay,
    zIndex: 1,
  },
  modalContent: {
    backgroundColor: P.cardBg,
    borderRadius: 24,
    width: '100%',
    maxWidth: 520,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: P.softBorder,
    overflow: 'hidden',
    paddingBottom: 34,
    zIndex: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 12,
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
  modalLoading: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 10,
    gap: 10,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 15,
  },
  clearButton: {
    padding: 4,
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
  questionnaireActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  questionActions: {
    flexDirection: 'row',
    gap: 6,
  },
  addQuestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: P.dashed,
    backgroundColor: P.lightBlue,
    marginHorizontal: 16,
    marginTop: 8,
  },
  addQuestionText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.primary,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  formModalContent: {
    backgroundColor: P.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 34,
    zIndex: 2,
  },
  formScrollView: {
    maxHeight: 500,
    paddingHorizontal: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: P.text,
    marginBottom: 8,
  },
  requiredAsterisk: {
    color: '#FF6F61',
  },
  formInput: {
    backgroundColor: P.inputBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: P.border,
    color: P.text,
  },
  formTextArea: {
    minHeight: 100,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  fieldTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fieldTypeOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: P.border,
  },
  fieldTypeOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: P.textSecondary,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: P.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: P.text,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: P.elevatedBg,
  },
  modalButtonPrimary: {
    backgroundColor: '#2D7DD2',
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  assignInfoCard: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.border,
  },
  assignInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  assignInfoSubtitle: {
    fontSize: 14,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  assignModalContentWrapper: {
    backgroundColor: P.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    height: '85%',
    zIndex: 2,
  },
  assignModalScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  patientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  patientIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  patientId: {
    fontSize: 13,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignModalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: P.border,
  },
  assignCloseButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignCloseButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  patientSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 8,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toggleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  closeButton: {
    padding: 4,
  },
});
