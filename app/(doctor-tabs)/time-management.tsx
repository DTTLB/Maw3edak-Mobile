import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput,
  Pressable,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Calendar,
  Clock,
  AlertCircle,
  Plus,
  CheckCircle,
  Edit2,
  Trash2,
  ArrowLeft,
  User,
  Building,
  ChevronDown,
  X,
  Search,
} from 'lucide-react-native';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/utils/config';
import { getDoctorPalette, DoctorPalette } from '@/utils/doctorPalette';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

const SCREEN_WIDTH = Dimensions.get('window').width;

type Doctor = {
  id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  specialization?: string;
  access_type: string;
};

type DaySchedule = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_day_off: boolean;
  clinics: {
    id: string;
    name: string;
    address: string;
  };
};

type ScheduleException = {
  id: string;
  exception_date: string;
  exception_type: string;
  start_time?: string;
  end_time?: string;
  reason?: string;
  clinics: {
    name: string;
  };
};

type ScheduleBlock = {
  id: string;
  block_date: string;
  start_time: string;
  end_time: string;
  block_type: string;
  reason?: string;
  clinics: {
    id: string;
    name: string;
    address: string;
  };
};

type Appointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  patients: {
    full_name: string;
    phone?: string;
  };
  clinics: {
    name: string;
  };
};

export default function TimeManagementScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { session } = useAuth();
  const { colors, isDark } = useTheme();
  const P = useMemo(() => getDoctorPalette(isDark), [isDark]);
  const styles = useMemo(() => makeStyles(P), [P]);
  const [loading, setLoading] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [activeTab, setActiveTab] = useState<'schedule' | 'exceptions' | 'blocks'>('schedule');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedClinic, setSelectedClinic] = useState<any | null>(null);
  const [, setIsTemporaryClinicSelection] = useState(false);
  const [showDoctorPicker, setShowDoctorPicker] = useState(false);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
  const [clinicSearchQuery, setClinicSearchQuery] = useState('');
  const [showClinicPicker, setShowClinicPicker] = useState(false);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [, setAppointments] = useState<Appointment[]>([]);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null);
  const [editingException, setEditingException] = useState<ScheduleException | null>(null);
  const [, setAllClinics] = useState<any[]>([]);
  const [filteredClinics, setFilteredClinics] = useState<any[]>([]);

  const [blockForm, setBlockForm] = useState({
    block_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '10:00',
    block_type: 'unavailable',
    reason: '',
  });

  const [exceptionForm, setExceptionForm] = useState({
    exception_date: new Date().toISOString().split('T')[0],
    exception_type: 'day_off',
    start_time: '',
    end_time: '',
    reason: '',
  });

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    day_of_week: 0,
    start_time: '09:00',
    end_time: '17:00',
    schedule_id: null as string | null,
  });

  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [timePickerConfig, setTimePickerConfig] = useState<{ type: 'schedule' | 'block' | 'exception', field: 'start' | 'end', currentValue: string } | null>(null);
  const [showBlockTypeDropdown, setShowBlockTypeDropdown] = useState(false);
  const [showInlineTimePicker, setShowInlineTimePicker] = useState<{ type: 'block' | 'exception' | 'schedule', field: 'start' | 'end' } | null>(null);

  useEffect(() => {
    console.log('[Modal Debug] Block Modal State:', showBlockModal);
  }, [showBlockModal]);

  useEffect(() => {
    console.log('[Modal Debug] Exception Modal State:', showExceptionModal);
  }, [showExceptionModal]);

  const fetchDoctorsAndClinics = useCallback(async () => {
    if (!session?.user?.global_id) {
      console.error('No session or global_id found');
      Alert.alert(t('common.error'), t('timeManagement.sessionNotFound'));
      setLoadingDoctors(false);
      return;
    }

    try {
      setLoadingDoctors(true);
      console.log('Fetching doctors for global_id:', session.user.global_id);

      const supabaseUrl = await getSupabaseUrl();
      const supabaseAnonKey = await getSupabaseAnonKey();
      console.log('Supabase URL:', supabaseUrl);

      const response = await fetch(
        `${supabaseUrl}/functions/v1/mobile-get-doctor-time-management`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            global_id: session.user.global_id,
            company_id: session.user.company_id,
          }),
        }
      );

      const result = await response.json();
      console.log('Time management API response:', JSON.stringify(result, null, 2));
      console.log('Response status:', response.status);

      if (result.success) {
        const doctorsList = result.data.doctors || [];
        console.log('Doctors list:', doctorsList);
        setDoctors(doctorsList);
        setAllClinics(result.data.clinics || []);
        setFilteredClinics([]);

        if (doctorsList.length === 0) {
          console.log('No doctors found in response');
          Alert.alert(t('timeManagement.noAccessTitle'), t('timeManagement.noAccessMessage'));
        }
      } else {
        console.error('API error:', result.error);
        Alert.alert(t('common.error'), result.error || t('timeManagement.failedToLoadDoctors'));
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      Alert.alert(t('common.error'), t('timeManagement.failedToLoadDoctorsDetail', { message: (error as Error).message }));
    } finally {
      setLoadingDoctors(false);
    }
  }, [session, t]);

  const fetchDoctorClinics = useCallback(async () => {
    if (!selectedDoctor) return;

    try {
      setLoading(true);

      const supabaseUrl = await getSupabaseUrl();
      const supabaseAnonKey = await getSupabaseAnonKey();

      const response = await fetch(
        `${supabaseUrl}/functions/v1/mobile-get-doctor-time-management`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            global_id: session?.user?.global_id,
            doctor_id: selectedDoctor.id,
            company_id: session?.user?.company_id,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setFilteredClinics(result.data.clinics || []);
        setSchedules([]);
        setExceptions([]);
        setBlocks([]);
        setAppointments([]);
      } else {
        Alert.alert(t('common.error'), result.error || t('timeManagement.failedToLoadClinics'));
      }
    } catch (error) {
      console.error('Error fetching doctor clinics:', error);
      Alert.alert(t('common.error'), t('timeManagement.failedToLoadClinics'));
    } finally {
      setLoading(false);
    }
  }, [selectedDoctor, session?.user?.global_id, session?.user?.company_id, t]);

  const fetchTimeManagementData = useCallback(async () => {
    try {
      setLoading(true);

      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const supabaseUrl = await getSupabaseUrl();
      const supabaseAnonKey = await getSupabaseAnonKey();

      const response = await fetch(
        `${supabaseUrl}/functions/v1/mobile-get-doctor-time-management`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            global_id: session?.user?.global_id,
            doctor_id: selectedDoctor?.id || null,
            clinic_id: selectedClinic?.id || null,
            company_id: session?.user?.company_id,
            start_date: today,
            end_date: futureDate,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setSchedules(result.data.schedules || []);
        setExceptions(result.data.exceptions || []);
        setBlocks(result.data.blocks || []);
        setAppointments(result.data.appointments || []);

        if (result.data.clinics) {
          setFilteredClinics(result.data.clinics);

          if (selectedClinic && !result.data.clinics.some((c: any) => c.id === selectedClinic.id)) {
            setSelectedClinic(null);
          }
        }
      } else {
        Alert.alert(t('common.error'), result.error || t('timeManagement.failedToLoadData'));
      }
    } catch (error) {
      console.error('Error fetching time management data:', error);
      Alert.alert(t('common.error'), t('timeManagement.failedToLoadDataDetail'));
    } finally {
      setLoading(false);
    }
  }, [session?.user?.global_id, session?.user?.company_id, selectedDoctor?.id, selectedClinic, t]);

  useEffect(() => {
    if (session?.user) {
      fetchDoctorsAndClinics();
    }
  }, [session, fetchDoctorsAndClinics]);

  useEffect(() => {
    if (session?.user?.company_id) {
      setSelectedDoctor(null);
      setSelectedClinic(null);
      setSchedules([]);
      setExceptions([]);
      setBlocks([]);
      setAppointments([]);
      setFilteredClinics([]);
      fetchDoctorsAndClinics();
    }
  }, [session?.user?.company_id, fetchDoctorsAndClinics]);

  useEffect(() => {
    if (selectedDoctor && selectedClinic) {
      fetchTimeManagementData();
    } else if (selectedDoctor && !selectedClinic) {
      fetchDoctorClinics();
    } else {
      setFilteredClinics([]);
      setSchedules([]);
      setExceptions([]);
      setBlocks([]);
      setAppointments([]);
    }
  }, [selectedDoctor, selectedClinic, fetchTimeManagementData, fetchDoctorClinics]);

  const handleCreateBlock = async () => {
    try {
      if (!selectedDoctor) {
        Alert.alert(t('common.error'), t('timeManagement.selectSpecificDoctor'));
        return;
      }

      if (!selectedClinic) {
        Alert.alert(t('common.error'), t('timeManagement.selectSpecificClinic'));
        return;
      }

      const supabaseUrl = await getSupabaseUrl();
      const supabaseAnonKey = await getSupabaseAnonKey();

      const response = await fetch(
        `${supabaseUrl}/functions/v1/mobile-create-schedule-block`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            global_id: session?.user?.global_id,
            doctor_id: selectedDoctor.id,
            clinic_id: selectedClinic.id,
            block_date: blockForm.block_date,
            start_time: blockForm.start_time,
            end_time: blockForm.end_time,
            block_type: blockForm.block_type,
            reason: blockForm.reason,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        Alert.alert(t('common.success'), t('timeManagement.blockCreated'));
        setShowBlockTypeDropdown(false);
        setShowInlineTimePicker(null);
        setShowBlockModal(false);
        fetchTimeManagementData();
        resetBlockForm();
      } else {
        Alert.alert(t('common.error'), result.error || t('timeManagement.failedToCreateBlock'));
      }
    } catch (error) {
      console.error('Error creating block:', error);
      Alert.alert(t('common.error'), t('timeManagement.failedToCreateBlock'));
    }
  };

  const handleUpdateBlock = async () => {
    try {
      if (!editingBlock) return;

      if (!selectedDoctor) {
        Alert.alert(t('common.error'), t('timeManagement.selectSpecificDoctor'));
        return;
      }

      if (!selectedClinic) {
        Alert.alert(t('common.error'), t('timeManagement.selectSpecificClinic'));
        return;
      }

      const supabaseUrl = await getSupabaseUrl();
      const supabaseAnonKey = await getSupabaseAnonKey();

      const response = await fetch(
        `${supabaseUrl}/functions/v1/mobile-update-schedule-block`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            global_id: session?.user?.global_id,
            doctor_id: selectedDoctor.id,
            clinic_id: selectedClinic.id,
            block_id: editingBlock.id,
            block_date: blockForm.block_date,
            start_time: blockForm.start_time,
            end_time: blockForm.end_time,
            block_type: blockForm.block_type,
            reason: blockForm.reason,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        Alert.alert(t('common.success'), t('timeManagement.blockUpdated'));
        setShowBlockTypeDropdown(false);
        setShowInlineTimePicker(null);
        setShowBlockModal(false);
        setEditingBlock(null);
        fetchTimeManagementData();
        resetBlockForm();
      } else {
        Alert.alert(t('common.error'), result.error || t('timeManagement.failedToUpdateBlock'));
      }
    } catch (error) {
      console.error('Error updating block:', error);
      Alert.alert(t('common.error'), t('timeManagement.failedToUpdateBlock'));
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    const confirmDelete = async () => {
      try {
        const supabaseUrl = await getSupabaseUrl();
        const supabaseAnonKey = await getSupabaseAnonKey();

        const response = await fetch(
          `${supabaseUrl}/functions/v1/mobile-delete-schedule-block`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({
              global_id: session?.user?.global_id,
              doctor_id: selectedDoctor?.id,
              block_id: blockId,
            }),
          }
        );

        const result = await response.json();

        if (result.success) {
          Alert.alert(t('common.success'), t('timeManagement.blockDeleted'));
          fetchTimeManagementData();
        } else {
          Alert.alert(t('common.error'), result.error || t('timeManagement.failedToDeleteBlock'));
        }
      } catch (error) {
        console.error('Error deleting block:', error);
        Alert.alert(t('common.error'), t('timeManagement.failedToDeleteBlock'));
      }
    };

    if (Platform.OS === 'web') {
      if (confirm(t('timeManagement.confirmDeleteBlock'))) {
        await confirmDelete();
      }
    } else {
      Alert.alert(t('timeManagement.deleteBlockTitle'), t('timeManagement.confirmDeleteBlock'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]);
    }
  };

  const openEditModal = (block: ScheduleBlock) => {
    setEditingBlock(block);
    const validBlockTypes = ['surgery', 'meeting', 'conference', 'training', 'not_in_clinic', 'unavailable', 'other'];
    setBlockForm({
      block_date: block.block_date,
      start_time: block.start_time,
      end_time: block.end_time,
      block_type: validBlockTypes.includes(block.block_type) ? block.block_type : 'unavailable',
      reason: block.reason || '',
    });
    setShowBlockModal(true);
  };

  const resetBlockForm = () => {
    setBlockForm({
      block_date: new Date().toISOString().split('T')[0],
      start_time: '09:00',
      end_time: '10:00',
      block_type: 'unavailable',
      reason: '',
    });
    setShowBlockTypeDropdown(false);
  };

  const resetExceptionForm = () => {
    setExceptionForm({
      exception_date: new Date().toISOString().split('T')[0],
      exception_type: 'day_off',
      start_time: '',
      end_time: '',
      reason: '',
    });
  };

  const generateTimeSlots = () => {
    const times = [];
    for (let hour = 7; hour <= 23; hour++) {
      for (let minute of [0, 30]) {
        const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const period = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const time12 = `${hour12.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
        times.push({ value: time24, label: time12 });
      }
    }
    return times;
  };

  const formatTimeTo12Hour = (time24: string) => {
    if (!time24) return '';
    const [hour, minute] = time24.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${hour12.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const handleTimeSelect = (time24: string) => {
    if (!timePickerConfig) return;

    // Update the appropriate form
    if (timePickerConfig.type === 'schedule') {
      if (timePickerConfig.field === 'start') {
        setScheduleForm({ ...scheduleForm, start_time: time24 });
      } else {
        setScheduleForm({ ...scheduleForm, end_time: time24 });
      }
    } else if (timePickerConfig.type === 'block') {
      if (timePickerConfig.field === 'start') {
        setBlockForm({ ...blockForm, start_time: time24 });
      } else {
        setBlockForm({ ...blockForm, end_time: time24 });
      }
    } else if (timePickerConfig.type === 'exception') {
      if (timePickerConfig.field === 'start') {
        setExceptionForm({ ...exceptionForm, start_time: time24 });
      } else {
        setExceptionForm({ ...exceptionForm, end_time: time24 });
      }
    }

    // Close modal after selection
    setShowTimePickerModal(false);
    setTimePickerConfig(null);
  };

  const handleCreateException = async () => {
    try {
      if (!selectedDoctor) {
        Alert.alert(t('common.error'), t('timeManagement.selectSpecificDoctor'));
        return;
      }

      if (!selectedClinic) {
        Alert.alert(t('common.error'), t('timeManagement.selectSpecificClinic'));
        return;
      }

      const supabaseUrl = await getSupabaseUrl();
      const supabaseAnonKey = await getSupabaseAnonKey();

      const response = await fetch(
        `${supabaseUrl}/functions/v1/mobile-create-schedule-exception`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            global_id: session?.user?.global_id,
            doctor_id: selectedDoctor.id,
            clinic_id: selectedClinic.id,
            ...exceptionForm,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        Alert.alert(t('common.success'), t('timeManagement.exceptionCreated'));
        setShowInlineTimePicker(null);
        setShowExceptionModal(false);
        fetchTimeManagementData();
        resetExceptionForm();
      } else {
        Alert.alert(t('common.error'), result.error || t('timeManagement.failedToCreateException'));
      }
    } catch (error) {
      console.error('Error creating exception:', error);
      Alert.alert(t('common.error'), t('timeManagement.failedToCreateException'));
    }
  };

  const handleUpdateException = async () => {
    try {
      if (!editingException) return;

      if (!selectedDoctor) {
        Alert.alert(t('common.error'), t('timeManagement.selectSpecificDoctor'));
        return;
      }

      if (!selectedClinic) {
        Alert.alert(t('common.error'), t('timeManagement.selectSpecificClinic'));
        return;
      }

      const supabaseUrl = await getSupabaseUrl();
      const supabaseAnonKey = await getSupabaseAnonKey();

      const response = await fetch(
        `${supabaseUrl}/functions/v1/mobile-update-schedule-exception`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            global_id: session?.user?.global_id,
            doctor_id: selectedDoctor.id,
            clinic_id: selectedClinic.id,
            exception_id: editingException.id,
            exception_date: exceptionForm.exception_date,
            exception_type: exceptionForm.exception_type,
            start_time: exceptionForm.start_time || null,
            end_time: exceptionForm.end_time || null,
            reason: exceptionForm.reason,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        Alert.alert(t('common.success'), t('timeManagement.exceptionUpdated'));
        setShowInlineTimePicker(null);
        setShowExceptionModal(false);
        setEditingException(null);
        fetchTimeManagementData();
        resetExceptionForm();
      } else {
        Alert.alert(t('common.error'), result.error || t('timeManagement.failedToUpdateException'));
      }
    } catch (error) {
      console.error('Error updating exception:', error);
      Alert.alert(t('common.error'), t('timeManagement.failedToUpdateException'));
    }
  };

  const handleDeleteException = async (exceptionId: string) => {
    const confirmDelete = async () => {
      try {
        const supabaseUrl = await getSupabaseUrl();
        const supabaseAnonKey = await getSupabaseAnonKey();

        const response = await fetch(
          `${supabaseUrl}/functions/v1/mobile-delete-schedule-exception`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({
              global_id: session?.user?.global_id,
              doctor_id: selectedDoctor?.id,
              exception_id: exceptionId,
            }),
          }
        );

        const result = await response.json();

        if (result.success) {
          Alert.alert(t('common.success'), t('timeManagement.exceptionDeleted'));
          fetchTimeManagementData();
        } else {
          Alert.alert(t('common.error'), result.error || t('timeManagement.failedToDeleteException'));
        }
      } catch (error) {
        console.error('Error deleting exception:', error);
        Alert.alert(t('common.error'), t('timeManagement.failedToDeleteException'));
      }
    };

    if (Platform.OS === 'web') {
      if (confirm(t('timeManagement.confirmDeleteException'))) {
        await confirmDelete();
      }
    } else {
      Alert.alert(t('timeManagement.deleteExceptionTitle'), t('timeManagement.confirmDeleteException'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]);
    }
  };

  const openEditExceptionModal = (exception: ScheduleException) => {
    setEditingException(exception);
    setExceptionForm({
      exception_date: exception.exception_date,
      exception_type: exception.exception_type,
      start_time: exception.start_time || '',
      end_time: exception.end_time || '',
      reason: exception.reason || '',
    });
    setShowExceptionModal(true);
  };

  const handleToggleSchedule = async (day: number, schedule: DaySchedule | null) => {
    if (!selectedDoctor || !selectedClinic) {
      Alert.alert(t('common.error'), t('timeManagement.selectDoctorAndClinic'));
      return;
    }

    if (schedule) {
      const confirmDelete = async () => {
        await handleDeleteSchedule(schedule.id);
      };

      if (Platform.OS === 'web') {
        if (confirm(t('timeManagement.removeScheduleConfirm', { day: t(`timeManagement.days.${day}`) }))) {
          await confirmDelete();
        }
      } else {
        Alert.alert(
          t('timeManagement.removeScheduleTitle'),
          t('timeManagement.removeScheduleConfirm', { day: t(`timeManagement.days.${day}`) }),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('timeManagement.remove'),
              style: 'destructive',
              onPress: confirmDelete,
            },
          ]
        );
      }
    } else {
      setScheduleForm({
        day_of_week: day,
        start_time: '09:00',
        end_time: '17:00',
        schedule_id: null,
      });
      setShowScheduleModal(true);
    }
  };

  const handleEditSchedule = (schedule: DaySchedule) => {
    setScheduleForm({
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time.slice(0, 5),
      end_time: schedule.end_time.slice(0, 5),
      schedule_id: schedule.id,
    });
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = async () => {
    if (!selectedDoctor || !selectedClinic) {
      Alert.alert(t('common.error'), t('timeManagement.selectBothDoctorAndClinic'));
      return;
    }

    if (!session?.user?.global_id) {
      Alert.alert(t('common.error'), t('timeManagement.sessionExpired'));
      return;
    }

    try {
      const supabaseUrl = await getSupabaseUrl();
      const supabaseAnonKey = await getSupabaseAnonKey();

      const requestData = {
        global_id: session.user.global_id,
        doctor_id: selectedDoctor.id,
        clinic_id: selectedClinic.id,
        day_of_week: scheduleForm.day_of_week,
        start_time: scheduleForm.start_time,
        end_time: scheduleForm.end_time,
        schedule_id: scheduleForm.schedule_id,
      };

      console.log('Saving schedule with data:', requestData);
      console.log('Selected doctor:', selectedDoctor);
      console.log('Selected clinic:', selectedClinic);

      const response = await fetch(
        `${supabaseUrl}/functions/v1/mobile-upsert-recurring-schedule`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify(requestData),
        }
      );

      const result = await response.json();
      console.log('Schedule save response:', result);

      if (result.success) {
        Alert.alert(t('common.success'), scheduleForm.schedule_id ? t('timeManagement.scheduleUpdated') : t('timeManagement.scheduleCreated'));
        setShowScheduleModal(false);
        setIsTemporaryClinicSelection(false);
        fetchTimeManagementData();
      } else {
        const errorMsg = result.details || result.error || t('timeManagement.failedToSaveSchedule');
        console.error('Schedule save error:', result);
        Alert.alert(t('common.error'), errorMsg);
      }
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      Alert.alert(t('common.error'), error?.message || t('timeManagement.failedToSaveSchedule'));
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!selectedDoctor) return;

    try {
      const supabaseUrl = await getSupabaseUrl();
      const supabaseAnonKey = await getSupabaseAnonKey();

      const response = await fetch(
        `${supabaseUrl}/functions/v1/mobile-delete-recurring-schedule`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            global_id: session?.user?.global_id,
            doctor_id: selectedDoctor.id,
            schedule_id: scheduleId,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        Alert.alert(t('common.success'), t('timeManagement.scheduleRemoved'));
        fetchTimeManagementData();
      } else {
        Alert.alert(t('common.error'), result.error || t('timeManagement.failedToDeleteSchedule'));
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      Alert.alert(t('common.error'), t('timeManagement.failedToDeleteSchedule'));
    }
  };

  // Helper functions for dark mode compatible colors
  const getActiveCardBackground = () => {
    return isDark ? '#0E3B37' : '#E4F8F4'; // Turquoise tint: dark for dark mode, light mint for light mode
  };

  const getBadgeBackground = (lightColor: string, darkColor: string) => {
    return isDark ? darkColor : lightColor;
  };

  const renderWeeklySchedule = () => {
    if (!selectedClinic) {
      return (
        <View style={styles.tabContent}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('timeManagement.weeklyScheduleByClinic')}</Text>
          {filteredClinics.map((clinic) => {
            const clinicSchedules = schedules.filter(s => s.clinics?.id === clinic.id);
            const groupedSchedules = clinicSchedules.reduce((acc, schedule) => {
              acc[schedule.day_of_week] = schedule;
              return acc;
            }, {} as Record<number, DaySchedule>);

            return (
              <View key={clinic.id} style={[styles.clinicSection, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <View style={styles.clinicTitleContainer}>
                  <Building size={24} color={colors.primary} strokeWidth={2.5} />
                  <Text style={[styles.clinicSectionTitle, { color: colors.text }]}>{clinic.name}</Text>
                </View>
                {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                  const daySchedule = groupedSchedules[day];
                  const isActive = !!daySchedule && !daySchedule.is_day_off;

                  return (
                    <View
                      key={day}
                      style={[
                        styles.scheduleCard,
                        {
                          backgroundColor: isActive ? getActiveCardBackground() : colors.backgroundSecondary,
                          borderWidth: 1,
                          borderColor: isActive ? '#15C2B0' : colors.border,
                        }
                      ]}
                    >
                      <View style={styles.scheduleHeader}>
                        <View style={styles.scheduleLeft}>
                          <Calendar size={18} color={isActive ? '#15C2B0' : colors.textTertiary} strokeWidth={2} />
                          <Text style={[styles.dayName, { color: isActive ? colors.text : colors.textSecondary, fontSize: 14 }]}>
                            {t(`timeManagement.days.${day}`)}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedClinic(clinic);
                            setIsTemporaryClinicSelection(true);
                            handleToggleSchedule(day, daySchedule || null);
                          }}
                          disabled={!selectedDoctor}
                        >
                          <View style={[styles.toggleSwitch, { backgroundColor: isActive ? '#15C2B0' : (isDark ? '#4B5563' : '#D1D5DB') }]}>
                            <View style={[styles.toggleThumb, { transform: [{ translateX: isActive ? 20 : 2 }] }]} />
                          </View>
                        </TouchableOpacity>
                      </View>

                      {isActive && daySchedule ? (
                        <TouchableOpacity
                          style={styles.scheduleTimeRow}
                          onPress={() => {
                            setSelectedClinic(clinic);
                            setIsTemporaryClinicSelection(true);
                            handleEditSchedule(daySchedule);
                          }}
                        >
                          <View style={styles.timeField}>
                            <Text style={[styles.timeLabel, { color: colors.textSecondary, fontSize: 10 }]}>{t('timeManagement.start')}</Text>
                            <View style={styles.timeInputContainer}>
                              <Text style={[styles.timeText, { color: colors.text, fontSize: 14 }]}>
                                {daySchedule.start_time.slice(0, 5)}
                              </Text>
                              <Edit2 size={12} color="#F59E0B" strokeWidth={2} />
                            </View>
                          </View>
                          <View style={styles.timeField}>
                            <Text style={[styles.timeLabel, { color: colors.textSecondary, fontSize: 10 }]}>{t('timeManagement.end')}</Text>
                            <View style={styles.timeInputContainer}>
                              <Text style={[styles.timeText, { color: colors.text, fontSize: 14 }]}>
                                {daySchedule.end_time.slice(0, 5)}
                              </Text>
                              <Edit2 size={12} color="#F59E0B" strokeWidth={2} />
                            </View>
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <Text style={[styles.dayOffText, { color: colors.textTertiary, fontSize: 12 }]}>{t('timeManagement.dayOff')}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      );
    }

    const filteredSchedules = schedules.filter(schedule => {
      const matchesClinic = !selectedClinic || schedule.clinics?.id === selectedClinic.id;
      return matchesClinic;
    });

    const groupedSchedules = filteredSchedules.reduce((acc, schedule) => {
      const day = schedule.day_of_week;
      if (!acc[day]) acc[day] = [];
      acc[day].push(schedule);
      return acc;
    }, {} as Record<number, DaySchedule[]>);

    const activeSchedules = filteredSchedules.filter(s => !s.is_day_off);
    const activeDays = activeSchedules.length;
    const totalHours = activeSchedules.reduce((sum, schedule) => {
      const start = new Date(`2000-01-01T${schedule.start_time}`);
      const end = new Date(`2000-01-01T${schedule.end_time}`);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);
    const minSet = activeSchedules.length > 0 ? Math.min(...activeSchedules.map(s => {
      const start = new Date(`2000-01-01T${s.start_time}`);
      const end = new Date(`2000-01-01T${s.end_time}`);
      return (end.getTime() - start.getTime()) / (1000 * 60);
    })) : 0;

    return (
      <View style={styles.tabContent}>
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{activeDays}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('timeManagement.activeDays')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{Math.round(totalHours)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('timeManagement.totalHours')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{Math.round(minSet)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('timeManagement.minSet')}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('timeManagement.weeklySchedule')}</Text>

        {[1, 2, 3, 4, 5, 6, 0].map((day) => {
          const daySchedule = groupedSchedules[day]?.[0];
          const isActive = !!daySchedule && !daySchedule.is_day_off;

          return (
            <View
              key={day}
              style={[
                styles.scheduleCard,
                {
                  backgroundColor: isActive ? getActiveCardBackground() : colors.card,
                  borderWidth: 2,
                  borderColor: isActive ? '#15C2B0' : colors.borderLight,
                }
              ]}
            >
              <View style={styles.scheduleHeader}>
                <View style={styles.scheduleLeft}>
                  <Calendar size={20} color={isActive ? '#15C2B0' : colors.textTertiary} strokeWidth={2} />
                  <Text style={[styles.dayName, { color: isActive ? colors.text : colors.textSecondary }]}>
                    {t(`timeManagement.days.${day}`)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleToggleSchedule(day, daySchedule || null)}
                  disabled={!selectedDoctor || !selectedClinic}
                >
                  <View style={[styles.toggleSwitch, { backgroundColor: isActive ? '#15C2B0' : (isDark ? '#4B5563' : '#D1D5DB') }]}>
                    <View style={[styles.toggleThumb, { transform: [{ translateX: isActive ? 20 : 2 }] }]} />
                  </View>
                </TouchableOpacity>
              </View>

              {isActive && daySchedule ? (
                <TouchableOpacity
                  style={styles.scheduleTimeRow}
                  onPress={() => handleEditSchedule(daySchedule)}
                >
                  <View style={styles.timeField}>
                    <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>{t('timeManagement.start')}</Text>
                    <View style={styles.timeInputContainer}>
                      <Text style={[styles.timeText, { color: colors.text }]}>
                        {daySchedule.start_time.slice(0, 5)}
                      </Text>
                      <Edit2 size={14} color="#F59E0B" strokeWidth={2} />
                    </View>
                  </View>
                  <View style={styles.timeField}>
                    <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>{t('timeManagement.end')}</Text>
                    <View style={styles.timeInputContainer}>
                      <Text style={[styles.timeText, { color: colors.text }]}>
                        {daySchedule.end_time.slice(0, 5)}
                      </Text>
                      <Edit2 size={14} color="#F59E0B" strokeWidth={2} />
                    </View>
                  </View>
                </TouchableOpacity>
              ) : (
                <Text style={[styles.dayOffText, { color: colors.textTertiary }]}>{t('timeManagement.dayOff')}</Text>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderExceptions = () => {
    if (exceptions.length === 0) {
      return (
        <View style={styles.tabContent}>
          <View style={styles.emptyState}>
            <AlertCircle size={48} color={colors.textTertiary} strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('timeManagement.noDaysOff')}</Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              {t('timeManagement.noDaysOffSubtext')}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: '#2D7DD2' }]}
            onPress={() => {
              if (!selectedDoctor) {
                Alert.alert(t('timeManagement.requiredTitle'), t('timeManagement.selectDoctorFirst'));
                return;
              }
              if (!selectedClinic) {
                Alert.alert(t('timeManagement.requiredTitle'), t('timeManagement.selectClinicFirst'));
                return;
              }
              setEditingException(null);
              resetExceptionForm();
              setShowExceptionModal(true);
            }}
          >
            <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.addButtonText}>{t('timeManagement.addException')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('timeManagement.daysOffHolidays')}</Text>

        {exceptions.map((exception) => {
          const exceptionDate = new Date(exception.exception_date);
          const isMultiDay = exception.reason?.includes('days') || exception.reason?.toLowerCase().includes('conference');
          const duration = exception.reason?.includes('3 days') ? t('timeManagement.duration3Days') : t('timeManagement.duration1Day');

          return (
            <View
              key={exception.id}
              style={[
                styles.exceptionCard,
                {
                  backgroundColor: colors.card,
                  borderLeftWidth: 4,
                  borderLeftColor: isMultiDay ? '#2D7DD2' : '#FF6F61',
                }
              ]}
            >
              <View style={styles.blockMainContent}>
                <View style={[styles.blockIconContainer, { backgroundColor: isMultiDay ? getBadgeBackground('#EAF3FC', '#16324E') : getBadgeBackground('#FFEDEB', '#5A211C') }]}>
                  <Calendar size={20} color={isMultiDay ? '#2D7DD2' : '#FF6F61'} strokeWidth={2} />
                </View>

                <View style={styles.blockInfo}>
                  <View style={styles.blockTopRow}>
                    <Text style={[styles.exceptionDateRange, { color: colors.text }]}>
                      {exceptionDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                      {isMultiDay && exception.end_time ? `-${exceptionDate.getDate() + 2}, ${exceptionDate.getFullYear()}` : `, ${exceptionDate.getFullYear()}`}
                    </Text>
                    <View style={styles.blockActionsRow}>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => openEditExceptionModal(exception)}
                      >
                        <Edit2 size={18} color={isMultiDay ? '#2D7DD2' : '#FF6F61'} strokeWidth={2} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => handleDeleteException(exception.id)}
                      >
                        <Trash2 size={18} color={colors.textSecondary} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={[styles.exceptionReasonText, { color: colors.text }]}>
                    {exception.reason || t('timeManagement.dayOffLabel')}
                  </Text>

                  <View style={[styles.durationBadge, { backgroundColor: isMultiDay ? getBadgeBackground('#EAF3FC', '#16324E') : getBadgeBackground('#FFEDEB', '#5A211C') }]}>
                    <Text style={[styles.durationText, { color: isMultiDay ? (isDark ? '#BFD9F5' : '#2D7DD2') : (isDark ? '#FFB3AC' : '#FF6F61') }]}>
                      {duration}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: '#2D7DD2' }]}
          onPress={() => {
            if (!selectedDoctor) {
              Alert.alert(t('timeManagement.requiredTitle'), t('timeManagement.selectDoctorFirst'));
              return;
            }
            if (!selectedClinic) {
              Alert.alert(t('timeManagement.requiredTitle'), t('timeManagement.selectClinicFirst'));
              return;
            }
            setEditingException(null);
            resetExceptionForm();
            setShowExceptionModal(true);
          }}
        >
          <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.addButtonText}>{t('timeManagement.addException')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderBlocks = () => {
    if (blocks.length === 0) {
      return (
        <View style={styles.tabContent}>
          <View style={styles.emptyState}>
            <Clock size={48} color={colors.textTertiary} strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('timeManagement.noBlockedTime')}</Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              {t('timeManagement.noBlockedTimeSubtext')}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: '#2D7DD2' }]}
            onPress={() => {
              if (!selectedDoctor) {
                Alert.alert(t('timeManagement.requiredTitle'), t('timeManagement.selectDoctorFirst'));
                return;
              }
              if (!selectedClinic) {
                Alert.alert(t('timeManagement.requiredTitle'), t('timeManagement.selectClinicFirst'));
                return;
              }
              setEditingBlock(null);
              resetBlockForm();
              setShowBlockModal(true);
            }}
          >
            <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.addButtonText}>{t('timeManagement.addBlockTime')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const getCategoryInfo = (reason: string) => {
      const lowerReason = reason?.toLowerCase() || '';
      if (lowerReason.includes('meeting')) return { label: t('timeManagement.categoryMeeting'), bg: getBadgeBackground('#FEF3C7', '#78350F'), color: '#F59E0B' };
      if (lowerReason.includes('training')) return { label: t('timeManagement.categoryTraining'), bg: getBadgeBackground('#EAF3FC', '#16324E'), color: '#2D7DD2' };
      if (lowerReason.includes('every') || lowerReason.includes('recurring')) return { label: t('timeManagement.categoryRecurring'), bg: getBadgeBackground('#FFEDEB', '#5A211C'), color: '#FF6F61' };
      return { label: t('timeManagement.categoryOther'), bg: getBadgeBackground('#F3F4F6', '#4B5563'), color: isDark ? '#9CA3AF' : '#6B7280' };
    };

    return (
      <View style={styles.tabContent}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('timeManagement.blockedTimePeriods')}</Text>

        {blocks.map((block) => {
          const category = getCategoryInfo(block.reason || '');
          const blockDate = new Date(block.block_date);
          const isRecurring = block.reason?.toLowerCase().includes('every');

          return (
            <View
              key={block.id}
              style={[
                styles.blockCard,
                {
                  backgroundColor: colors.card,
                  borderLeftWidth: 4,
                  borderLeftColor: '#F59E0B',
                }
              ]}
            >
              <View style={styles.blockMainContent}>
                <View style={[styles.blockIconContainer, { backgroundColor: getBadgeBackground('#FEF3C7', '#78350F') }]}>
                  <Clock size={20} color="#F59E0B" strokeWidth={2} />
                </View>

                <View style={styles.blockInfo}>
                  <View style={styles.blockTopRow}>
                    <Text style={[styles.blockDateText, { color: colors.text }]}>
                      {isRecurring ? block.reason?.split(' ')[0] + ' ' + block.reason?.split(' ')[1] : blockDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                    <View style={styles.blockActionsRow}>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => openEditModal(block)}
                      >
                        <Edit2 size={18} color="#F59E0B" strokeWidth={2} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => handleDeleteBlock(block.id)}
                      >
                        <Trash2 size={18} color={colors.textSecondary} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={[styles.blockTimeRange, { color: colors.textSecondary }]}>
                    {block.start_time.slice(0, 5)} - {block.end_time.slice(0, 5)}
                  </Text>

                  <Text style={[styles.blockReasonText, { color: colors.text }]}>
                    {block.reason || t('timeManagement.blockedTimeLabel')}
                  </Text>

                  <View style={[styles.categoryBadge, { backgroundColor: category.bg }]}>
                    <Text style={[styles.categoryText, { color: category.color }]}>
                      {category.label}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: '#2D7DD2' }]}
          onPress={() => {
            if (!selectedDoctor) {
              Alert.alert(t('timeManagement.requiredTitle'), t('timeManagement.selectDoctorFirst'));
              return;
            }
            if (!selectedClinic) {
              Alert.alert(t('timeManagement.requiredTitle'), t('timeManagement.selectClinicFirst'));
              return;
            }
            setEditingBlock(null);
            resetBlockForm();
            setShowBlockModal(true);
          }}
        >
          <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.addButtonText}>{t('timeManagement.addBlockTime')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const filteredDoctors = useMemo(() => {
    if (!doctorSearchQuery.trim()) {
      return doctors;
    }
    const query = doctorSearchQuery.toLowerCase().trim();
    return doctors.filter((doctor) =>
      (doctor.full_name?.toLowerCase() || '').includes(query) ||
      (doctor.specialization?.toLowerCase() || '').includes(query)
    );
  }, [doctors, doctorSearchQuery]);

  const searchedClinics = useMemo(() => {
    if (!clinicSearchQuery.trim()) {
      return filteredClinics;
    }
    const query = clinicSearchQuery.toLowerCase().trim();
    return filteredClinics.filter((clinic) =>
      (clinic.name?.toLowerCase() || '').includes(query) ||
      (clinic.address?.toLowerCase() || '').includes(query)
    );
  }, [filteredClinics, clinicSearchQuery]);

  const renderDoctorPickerModal = () => (
    <Modal
      visible={showDoctorPicker}
      transparent
      animationType="fade"
      onRequestClose={() => {
        setShowDoctorPicker(false);
        setDoctorSearchQuery('');
      }}
    >
      <TouchableOpacity
        style={styles.pickerModalOverlay}
        activeOpacity={1}
        onPress={() => {
          setShowDoctorPicker(false);
          setDoctorSearchQuery('');
        }}
      >
        <View
          style={[styles.pickerModalContent, { backgroundColor: colors.card, borderColor: P.softBorder }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.pickerModalHeader}>
            <Text style={[styles.pickerModalTitle, { color: colors.text }]}>{t('timeManagement.selectDoctorTitle')}</Text>
            <TouchableOpacity onPress={() => { setShowDoctorPicker(false); setDoctorSearchQuery(''); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={24} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={[styles.pickerSearchContainer, { backgroundColor: colors.background, borderColor: P.softBorder }]}>
            <Search size={18} color={colors.textTertiary} strokeWidth={2} />
            <TextInput
              style={[styles.pickerSearchInput, { color: colors.text }]}
              placeholder={t('timeManagement.searchDoctors')}
              placeholderTextColor={colors.textTertiary}
              value={doctorSearchQuery}
              onChangeText={setDoctorSearchQuery}
            />
            {doctorSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setDoctorSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color={colors.textTertiary} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.pickerList} keyboardShouldPersistTaps="handled">
            {filteredDoctors.length === 0 ? (
              <View style={styles.emptyPickerState}>
                <User size={32} color={colors.textTertiary} strokeWidth={1.5} />
                <Text style={[styles.emptyPickerText, { color: colors.textSecondary }]}>
                  {t('timeManagement.noMatchingDoctors')}
                </Text>
              </View>
            ) : (
              filteredDoctors.map((doctor) => (
              <TouchableOpacity
                key={doctor.id}
                style={[
                  styles.pickerItem,
                  {
                    backgroundColor: selectedDoctor?.id === doctor.id ? colors.primaryLight : 'transparent',
                    borderBottomColor: colors.borderLight,
                  }
                ]}
                onPress={() => {
                  setSelectedDoctor(doctor);
                  setSelectedClinic(null);
                  setShowDoctorPicker(false);
                  setDoctorSearchQuery('');
                }}
              >
                <View style={styles.pickerItemInfo}>
                  <Text style={[styles.pickerItemName, { color: colors.text }]}>
                    {t('timeManagement.doctorPrefix', { name: doctor.full_name })}
                  </Text>
                  {doctor.specialization && (
                    <Text style={[styles.pickerItemSubtext, { color: colors.textSecondary }]}>
                      {doctor.specialization}
                    </Text>
                  )}
                </View>
                {selectedDoctor?.id === doctor.id && (
                  <CheckCircle size={20} color={colors.primary} strokeWidth={2} />
                )}
              </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderClinicPickerModal = () => (
    <Modal
      visible={showClinicPicker}
      transparent
      animationType="fade"
      onRequestClose={() => {
        setShowClinicPicker(false);
        setClinicSearchQuery('');
      }}
    >
      <TouchableOpacity
        style={styles.pickerModalOverlay}
        activeOpacity={1}
        onPress={() => {
          setShowClinicPicker(false);
          setClinicSearchQuery('');
        }}
      >
        <View
          style={[styles.pickerModalContent, { backgroundColor: colors.card, borderColor: P.softBorder }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.pickerModalHeader}>
            <Text style={[styles.pickerModalTitle, { color: colors.text }]}>{t('timeManagement.selectClinicTitle')}</Text>
            <TouchableOpacity onPress={() => { setShowClinicPicker(false); setClinicSearchQuery(''); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={24} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {filteredClinics.length > 0 && (
            <View style={[styles.pickerSearchContainer, { backgroundColor: colors.background, borderColor: P.softBorder }]}>
              <Search size={18} color={colors.textTertiary} strokeWidth={2} />
              <TextInput
                style={[styles.pickerSearchInput, { color: colors.text }]}
                placeholder={t('timeManagement.searchClinics')}
                placeholderTextColor={colors.textTertiary}
                value={clinicSearchQuery}
                onChangeText={setClinicSearchQuery}
              />
              {clinicSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setClinicSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={16} color={colors.textTertiary} strokeWidth={2} />
                </TouchableOpacity>
              )}
            </View>
          )}

          <ScrollView style={styles.pickerList} keyboardShouldPersistTaps="handled">
            {filteredClinics.length === 0 ? (
              <View style={styles.emptyPickerState}>
                <Building size={32} color={colors.textTertiary} strokeWidth={1.5} />
                <Text style={[styles.emptyPickerText, { color: colors.textSecondary }]}>
                  {t('timeManagement.noClinicsAvailable')}
                </Text>
                <Text style={[styles.emptyPickerSubtext, { color: colors.textTertiary }]}>
                  {t('timeManagement.noClinicsSubtext')}
                </Text>
              </View>
            ) : searchedClinics.length === 0 ? (
              <View style={styles.emptyPickerState}>
                <Building size={32} color={colors.textTertiary} strokeWidth={1.5} />
                <Text style={[styles.emptyPickerText, { color: colors.textSecondary }]}>
                  {t('timeManagement.noMatchingClinics')}
                </Text>
              </View>
            ) : (
              searchedClinics.map((clinic) => (
              <TouchableOpacity
                key={clinic.id}
                style={[
                  styles.pickerItem,
                  {
                    backgroundColor: selectedClinic?.id === clinic.id ? colors.primaryLight : 'transparent',
                    borderBottomColor: colors.borderLight,
                  }
                ]}
                onPress={() => {
                  setSelectedClinic(clinic);
                  setShowClinicPicker(false);
                }}
              >
                <View style={styles.pickerItemInfo}>
                  <Text style={[styles.pickerItemName, { color: colors.text }]}>
                    {clinic.name}
                  </Text>
                  {clinic.address && (
                    <Text style={[styles.pickerItemSubtext, { color: colors.textSecondary }]}>
                      {clinic.address}
                    </Text>
                  )}
                </View>
                {selectedClinic?.id === clinic.id && (
                  <CheckCircle size={20} color={colors.primary} strokeWidth={2} />
                )}
              </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderScheduleModal = () => (
    <Modal
      visible={showScheduleModal}
      transparent
      animationType="slide"
      onRequestClose={() => {
        setShowInlineTimePicker(null);
        setShowScheduleModal(false);
        setIsTemporaryClinicSelection(false);
      }}
    >
      <TouchableWithoutFeedback onPress={() => {
        Keyboard.dismiss();
        setShowInlineTimePicker(null);
        setShowScheduleModal(false);
        setIsTemporaryClinicSelection(false);
      }}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
              >
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {scheduleForm.schedule_id ? t('timeManagement.editDay', { day: t(`timeManagement.days.${scheduleForm.day_of_week}`) }) : t('timeManagement.addDay', { day: t(`timeManagement.days.${scheduleForm.day_of_week}`) })}
                </Text>

            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('timeManagement.startTime')}</Text>
            <View>
              <TouchableOpacity
                style={[
                  styles.input,
                  styles.timeInput,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: P.inputBorder,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }
                ]}
                onPress={() => {
                  setShowInlineTimePicker(
                    showInlineTimePicker?.type === 'schedule' && showInlineTimePicker?.field === 'start'
                      ? null
                      : { type: 'schedule', field: 'start' }
                  );
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Clock size={18} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={{ color: colors.text, fontSize: 16 }}>
                    {formatTimeTo12Hour(scheduleForm.start_time) || t('timeManagement.selectTime')}
                  </Text>
                </View>
                <ChevronDown size={18} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
              {showInlineTimePicker?.type === 'schedule' && showInlineTimePicker?.field === 'start' && (
                <View style={[styles.timeDropdown, { backgroundColor: colors.card, borderColor: colors.borderLight, maxHeight: 200 }]}>
                  <ScrollView
                    style={styles.timeDropdownScroll}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={true}
                  >
                    {generateTimeSlots().map((slot) => (
                      <TouchableOpacity
                        key={slot.value}
                        style={[
                          styles.timeDropdownItem,
                          {
                            backgroundColor: scheduleForm.start_time === slot.value ? colors.primaryLight : 'transparent',
                            borderBottomColor: colors.borderLight,
                          }
                        ]}
                        onPress={() => {
                          setScheduleForm({ ...scheduleForm, start_time: slot.value });
                          setShowInlineTimePicker(null);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.timeDropdownItemText, {
                          color: scheduleForm.start_time === slot.value ? colors.primary : colors.text,
                          fontWeight: scheduleForm.start_time === slot.value ? '600' : '400'
                        }]}>
                          {slot.label}
                        </Text>
                        {scheduleForm.start_time === slot.value && (
                          <CheckCircle size={18} color={colors.primary} strokeWidth={2} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('timeManagement.endTime')}</Text>
            <View>
              <TouchableOpacity
                style={[
                  styles.input,
                  styles.timeInput,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: P.inputBorder,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }
                ]}
                onPress={() => {
                  setShowInlineTimePicker(
                    showInlineTimePicker?.type === 'schedule' && showInlineTimePicker?.field === 'end'
                      ? null
                      : { type: 'schedule', field: 'end' }
                  );
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Clock size={18} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={{ color: colors.text, fontSize: 16 }}>
                    {formatTimeTo12Hour(scheduleForm.end_time) || t('timeManagement.selectTime')}
                  </Text>
                </View>
                <ChevronDown size={18} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
              {showInlineTimePicker?.type === 'schedule' && showInlineTimePicker?.field === 'end' && (
                <View style={[styles.timeDropdown, { backgroundColor: colors.card, borderColor: colors.borderLight, maxHeight: 200 }]}>
                  <ScrollView
                    style={styles.timeDropdownScroll}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={true}
                  >
                    {generateTimeSlots().map((slot) => (
                      <TouchableOpacity
                        key={slot.value}
                        style={[
                          styles.timeDropdownItem,
                          {
                            backgroundColor: scheduleForm.end_time === slot.value ? colors.primaryLight : 'transparent',
                            borderBottomColor: colors.borderLight,
                          }
                        ]}
                        onPress={() => {
                          setScheduleForm({ ...scheduleForm, end_time: slot.value });
                          setShowInlineTimePicker(null);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.timeDropdownItemText, {
                          color: scheduleForm.end_time === slot.value ? colors.primary : colors.text,
                          fontWeight: scheduleForm.end_time === slot.value ? '600' : '400'
                        }]}>
                          {slot.label}
                        </Text>
                        {scheduleForm.end_time === slot.value && (
                          <CheckCircle size={18} color={colors.primary} strokeWidth={2} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => {
                  setShowInlineTimePicker(null);
                  setShowScheduleModal(false);
                  setIsTemporaryClinicSelection(false);
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveSchedule}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const renderBlockModal = () => (
    <Modal
      visible={showBlockModal}
      transparent
      animationType="slide"
      onRequestClose={() => {
        Keyboard.dismiss();
        setShowBlockTypeDropdown(false);
        setShowInlineTimePicker(null);
        setShowBlockModal(false);
        setEditingBlock(null);
        resetBlockForm();
      }}
    >
      <TouchableWithoutFeedback onPress={() => {
        Keyboard.dismiss();
        setShowBlockTypeDropdown(false);
        setShowInlineTimePicker(null);
        setShowBlockModal(false);
        setEditingBlock(null);
        resetBlockForm();
      }}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
              >
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {editingBlock ? t('timeManagement.editScheduleBlock') : t('timeManagement.createScheduleBlock')}
                </Text>

                  <Text style={[styles.label, { color: colors.textSecondary }]}>
                    {selectedDoctor && selectedClinic ? `${selectedDoctor.full_name} - ${selectedClinic.name}` : t('timeManagement.doctorAndClinic')}
                  </Text>

                  <Text style={[styles.label, { color: colors.textSecondary }]}>{t('timeManagement.blockType')}</Text>
                  <View>
                    <TouchableOpacity
                      style={[
                        styles.input,
                        styles.timeInput,
                        {
                          backgroundColor: colors.backgroundSecondary,
                          borderColor: P.inputBorder,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }
                      ]}
                      onPress={() => {
                        Keyboard.dismiss();
                        setShowBlockTypeDropdown(!showBlockTypeDropdown);
                      }}
                    >
                      <Text style={{ color: colors.text, fontSize: 15 }}>
                        {blockForm.block_type === 'unavailable' && t('timeManagement.blockTypeUnavailable')}
                        {blockForm.block_type === 'meeting' && t('timeManagement.blockTypeMeeting')}
                        {blockForm.block_type === 'surgery' && t('timeManagement.blockTypeSurgery')}
                        {blockForm.block_type === 'conference' && t('timeManagement.blockTypeConference')}
                        {blockForm.block_type === 'training' && t('timeManagement.blockTypeTraining')}
                        {blockForm.block_type === 'not_in_clinic' && t('timeManagement.blockTypeNotInClinic')}
                        {blockForm.block_type === 'other' && t('timeManagement.blockTypeOther')}
                      </Text>
                      <ChevronDown size={16} color={colors.textSecondary} strokeWidth={2} />
                    </TouchableOpacity>
                    {renderInlineBlockTypePicker()}
                  </View>

                  <Text style={[styles.label, { color: colors.textSecondary }]}>{t('timeManagement.date')}</Text>
                  <TextInput
                    style={[styles.input, styles.timeInput, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text }]}
                    value={blockForm.block_date}
                    onChangeText={(text) => setBlockForm({ ...blockForm, block_date: text })}
                    placeholder={t('timeManagement.datePlaceholder')}
                    placeholderTextColor={colors.textTertiary}
                  />

                  <View style={styles.timeRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>{t('timeManagement.startTime')}</Text>
                      <View>
                        <TouchableOpacity
                          style={[
                            styles.input,
                            styles.timeInput,
                            {
                              backgroundColor: colors.backgroundSecondary,
                              borderColor: P.inputBorder,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }
                          ]}
                          onPress={() => {
                            Keyboard.dismiss();
                            setShowInlineTimePicker(
                              showInlineTimePicker?.type === 'block' && showInlineTimePicker?.field === 'start'
                                ? null
                                : { type: 'block', field: 'start' }
                            );
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Clock size={SCREEN_WIDTH < 768 ? 18 : 16} color={colors.textSecondary} strokeWidth={2} />
                            <Text style={{ color: colors.text, fontSize: SCREEN_WIDTH < 768 ? 16 : 15 }}>
                              {formatTimeTo12Hour(blockForm.start_time) || t('timeManagement.select')}
                            </Text>
                          </View>
                          <ChevronDown size={SCREEN_WIDTH < 768 ? 18 : 16} color={colors.textSecondary} strokeWidth={2} />
                        </TouchableOpacity>
                        {showInlineTimePicker?.type === 'block' && showInlineTimePicker?.field === 'start' && (
                          <View style={[styles.timeDropdown, { backgroundColor: colors.card, borderColor: colors.borderLight, maxHeight: 200 }]}>
                            <ScrollView
                              style={styles.timeDropdownScroll}
                              nestedScrollEnabled
                              showsVerticalScrollIndicator={true}
                            >
                              {generateTimeSlots().map((slot) => (
                                <TouchableOpacity
                                  key={slot.value}
                                  style={[
                                    styles.timeDropdownItem,
                                    {
                                      backgroundColor: blockForm.start_time === slot.value ? colors.primaryLight : 'transparent',
                                      borderBottomColor: colors.borderLight,
                                    }
                                  ]}
                                  onPress={() => {
                                    setBlockForm({ ...blockForm, start_time: slot.value });
                                    setShowInlineTimePicker(null);
                                  }}
                                  activeOpacity={0.7}
                                >
                                  <Text style={[styles.timeDropdownItemText, {
                                    color: blockForm.start_time === slot.value ? colors.primary : colors.text,
                                    fontWeight: blockForm.start_time === slot.value ? '600' : '400'
                                  }]}>
                                    {slot.label}
                                  </Text>
                                  {blockForm.start_time === slot.value && (
                                    <CheckCircle size={18} color={colors.primary} strokeWidth={2} />
                                  )}
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>{t('timeManagement.endTime')}</Text>
                      <View>
                        <TouchableOpacity
                          style={[
                            styles.input,
                            styles.timeInput,
                            {
                              backgroundColor: colors.backgroundSecondary,
                              borderColor: P.inputBorder,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }
                          ]}
                          onPress={() => {
                            Keyboard.dismiss();
                            setShowInlineTimePicker(
                              showInlineTimePicker?.type === 'block' && showInlineTimePicker?.field === 'end'
                                ? null
                                : { type: 'block', field: 'end' }
                            );
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Clock size={SCREEN_WIDTH < 768 ? 18 : 16} color={colors.textSecondary} strokeWidth={2} />
                            <Text style={{ color: colors.text, fontSize: SCREEN_WIDTH < 768 ? 16 : 15 }}>
                              {formatTimeTo12Hour(blockForm.end_time) || t('timeManagement.select')}
                            </Text>
                          </View>
                          <ChevronDown size={SCREEN_WIDTH < 768 ? 18 : 16} color={colors.textSecondary} strokeWidth={2} />
                        </TouchableOpacity>
                        {showInlineTimePicker?.type === 'block' && showInlineTimePicker?.field === 'end' && (
                          <View style={[styles.timeDropdown, { backgroundColor: colors.card, borderColor: colors.borderLight, maxHeight: 200 }]}>
                            <ScrollView
                              style={styles.timeDropdownScroll}
                              nestedScrollEnabled
                              showsVerticalScrollIndicator={true}
                            >
                              {generateTimeSlots().map((slot) => (
                                <TouchableOpacity
                                  key={slot.value}
                                  style={[
                                    styles.timeDropdownItem,
                                    {
                                      backgroundColor: blockForm.end_time === slot.value ? colors.primaryLight : 'transparent',
                                      borderBottomColor: colors.borderLight,
                                    }
                                  ]}
                                  onPress={() => {
                                    setBlockForm({ ...blockForm, end_time: slot.value });
                                    setShowInlineTimePicker(null);
                                  }}
                                  activeOpacity={0.7}
                                >
                                  <Text style={[styles.timeDropdownItemText, {
                                    color: blockForm.end_time === slot.value ? colors.primary : colors.text,
                                    fontWeight: blockForm.end_time === slot.value ? '600' : '400'
                                  }]}>
                                    {slot.label}
                                  </Text>
                                  {blockForm.end_time === slot.value && (
                                    <CheckCircle size={18} color={colors.primary} strokeWidth={2} />
                                  )}
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  <Text style={[styles.label, { color: colors.textSecondary }]}>{t('timeManagement.reasonOptional')}</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, styles.timeInput, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text }]}
                    value={blockForm.reason}
                    onChangeText={(text) => setBlockForm({ ...blockForm, reason: text })}
                    placeholder={t('timeManagement.blockReasonPlaceholder')}
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    numberOfLines={3}
                  />

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: colors.backgroundSecondary }]}
                      onPress={() => {
                        Keyboard.dismiss();
                        setShowBlockTypeDropdown(false);
                        setShowInlineTimePicker(null);
                        setShowBlockModal(false);
                        setEditingBlock(null);
                        resetBlockForm();
                      }}
                    >
                      <Text style={[styles.modalButtonText, { color: colors.text }]}>{t('common.cancel')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: colors.primary }]}
                      onPress={editingBlock ? handleUpdateBlock : handleCreateBlock}
                    >
                      <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                        {editingBlock ? t('timeManagement.update') : t('timeManagement.create')}
                      </Text>
                    </TouchableOpacity>
                  </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const renderExceptionModal = () => (
    <Modal
      visible={showExceptionModal}
      transparent
      animationType="slide"
      onRequestClose={() => {
        Keyboard.dismiss();
        setShowInlineTimePicker(null);
        setShowExceptionModal(false);
        setEditingException(null);
        resetExceptionForm();
      }}
    >
      <TouchableWithoutFeedback onPress={() => {
        Keyboard.dismiss();
        setShowInlineTimePicker(null);
        setShowExceptionModal(false);
        setEditingException(null);
        resetExceptionForm();
      }}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
              >
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {editingException ? t('timeManagement.editScheduleException') : t('timeManagement.createScheduleException')}
                </Text>

                  <Text style={[styles.label, { color: colors.textSecondary }]}>
                    {selectedDoctor && selectedClinic ? `${selectedDoctor.full_name} - ${selectedClinic.name}` : t('timeManagement.doctorAndClinic')}
                  </Text>

                  <Text style={[styles.label, { color: colors.textSecondary }]}>{t('timeManagement.exceptionType')}</Text>
                  <View style={styles.pickerContainer}>
                    <TouchableOpacity
                      style={[
                        styles.clinicOption,
                        {
                          backgroundColor: exceptionForm.exception_type === 'day_off' ? colors.primaryLight : colors.backgroundSecondary,
                          borderColor: exceptionForm.exception_type === 'day_off' ? colors.primary : P.inputBorder,
                          borderWidth: 1,
                        }
                      ]}
                      onPress={() => {
                        Keyboard.dismiss();
                        setExceptionForm({ ...exceptionForm, exception_type: 'day_off' });
                      }}
                    >
                      <Text style={[
                        styles.clinicOptionText,
                        { color: exceptionForm.exception_type === 'day_off' ? colors.primary : colors.text }
                      ]}>
                        {t('timeManagement.dayOffOption')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.clinicOption,
                        {
                          backgroundColor: exceptionForm.exception_type === 'custom_hours' ? colors.primaryLight : colors.backgroundSecondary,
                          borderColor: exceptionForm.exception_type === 'custom_hours' ? colors.primary : P.inputBorder,
                          borderWidth: 1,
                        }
                      ]}
                      onPress={() => {
                        Keyboard.dismiss();
                        setExceptionForm({ ...exceptionForm, exception_type: 'custom_hours' });
                      }}
                    >
                      <Text style={[
                        styles.clinicOptionText,
                        { color: exceptionForm.exception_type === 'custom_hours' ? colors.primary : colors.text }
                      ]}>
                        {t('timeManagement.customHours')}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.label, { color: colors.textSecondary }]}>{t('timeManagement.date')}</Text>
                  <TextInput
                    style={[styles.input, styles.timeInput, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text }]}
                    value={exceptionForm.exception_date}
                    onChangeText={(text) => setExceptionForm({ ...exceptionForm, exception_date: text })}
                    placeholder={t('timeManagement.datePlaceholder')}
                    placeholderTextColor={colors.textTertiary}
                  />

                  {exceptionForm.exception_type === 'custom_hours' && (
                    <View style={styles.timeRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('timeManagement.startTime')}</Text>
                        <View>
                          <TouchableOpacity
                            style={[
                              styles.input,
                              styles.timeInput,
                              {
                                backgroundColor: colors.backgroundSecondary,
                                borderColor: P.inputBorder,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }
                            ]}
                            onPress={() => {
                              Keyboard.dismiss();
                              setShowInlineTimePicker(
                                showInlineTimePicker?.type === 'exception' && showInlineTimePicker?.field === 'start'
                                  ? null
                                  : { type: 'exception', field: 'start' }
                              );
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Clock size={16} color={colors.textSecondary} strokeWidth={2} />
                              <Text style={{ color: colors.text, fontSize: 15 }}>
                                {formatTimeTo12Hour(exceptionForm.start_time) || t('timeManagement.select')}
                              </Text>
                            </View>
                            <ChevronDown size={SCREEN_WIDTH < 768 ? 18 : 16} color={colors.textSecondary} strokeWidth={2} />
                          </TouchableOpacity>
                          {showInlineTimePicker?.type === 'exception' && showInlineTimePicker?.field === 'start' && (
                            <View style={[styles.timeDropdown, { backgroundColor: colors.card, borderColor: colors.borderLight, maxHeight: 200 }]}>
                              <ScrollView
                                style={styles.timeDropdownScroll}
                                nestedScrollEnabled
                                showsVerticalScrollIndicator={true}
                              >
                                {generateTimeSlots().map((slot) => (
                                  <TouchableOpacity
                                    key={slot.value}
                                    style={[
                                      styles.timeDropdownItem,
                                      {
                                        backgroundColor: exceptionForm.start_time === slot.value ? colors.primaryLight : 'transparent',
                                        borderBottomColor: colors.borderLight,
                                      }
                                    ]}
                                    onPress={() => {
                                      setExceptionForm({ ...exceptionForm, start_time: slot.value });
                                      setShowInlineTimePicker(null);
                                    }}
                                    activeOpacity={0.7}
                                  >
                                    <Text style={[styles.timeDropdownItemText, {
                                      color: exceptionForm.start_time === slot.value ? colors.primary : colors.text,
                                      fontWeight: exceptionForm.start_time === slot.value ? '600' : '400'
                                    }]}>
                                      {slot.label}
                                    </Text>
                                    {exceptionForm.start_time === slot.value && (
                                      <CheckCircle size={18} color={colors.primary} strokeWidth={2} />
                                    )}
                                  </TouchableOpacity>
                                ))}
                              </ScrollView>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('timeManagement.endTime')}</Text>
                        <View>
                          <TouchableOpacity
                            style={[
                              styles.input,
                              styles.timeInput,
                              {
                                backgroundColor: colors.backgroundSecondary,
                                borderColor: P.inputBorder,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }
                            ]}
                            onPress={() => {
                              Keyboard.dismiss();
                              setShowInlineTimePicker(
                                showInlineTimePicker?.type === 'exception' && showInlineTimePicker?.field === 'end'
                                  ? null
                                  : { type: 'exception', field: 'end' }
                              );
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Clock size={16} color={colors.textSecondary} strokeWidth={2} />
                              <Text style={{ color: colors.text, fontSize: 15 }}>
                                {formatTimeTo12Hour(exceptionForm.end_time) || t('timeManagement.select')}
                              </Text>
                            </View>
                            <ChevronDown size={SCREEN_WIDTH < 768 ? 18 : 16} color={colors.textSecondary} strokeWidth={2} />
                          </TouchableOpacity>
                          {showInlineTimePicker?.type === 'exception' && showInlineTimePicker?.field === 'end' && (
                            <View style={[styles.timeDropdown, { backgroundColor: colors.card, borderColor: colors.borderLight, maxHeight: 200 }]}>
                              <ScrollView
                                style={styles.timeDropdownScroll}
                                nestedScrollEnabled
                                showsVerticalScrollIndicator={true}
                              >
                                {generateTimeSlots().map((slot) => (
                                  <TouchableOpacity
                                    key={slot.value}
                                    style={[
                                      styles.timeDropdownItem,
                                      {
                                        backgroundColor: exceptionForm.end_time === slot.value ? colors.primaryLight : 'transparent',
                                        borderBottomColor: colors.borderLight,
                                      }
                                    ]}
                                    onPress={() => {
                                      setExceptionForm({ ...exceptionForm, end_time: slot.value });
                                      setShowInlineTimePicker(null);
                                    }}
                                    activeOpacity={0.7}
                                  >
                                    <Text style={[styles.timeDropdownItemText, {
                                      color: exceptionForm.end_time === slot.value ? colors.primary : colors.text,
                                      fontWeight: exceptionForm.end_time === slot.value ? '600' : '400'
                                    }]}>
                                      {slot.label}
                                    </Text>
                                    {exceptionForm.end_time === slot.value && (
                                      <CheckCircle size={18} color={colors.primary} strokeWidth={2} />
                                    )}
                                  </TouchableOpacity>
                                ))}
                              </ScrollView>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  )}

                  <Text style={[styles.label, { color: colors.textSecondary }]}>{t('timeManagement.reasonOptional')}</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, styles.timeInput, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text }]}
                    value={exceptionForm.reason}
                    onChangeText={(text) => setExceptionForm({ ...exceptionForm, reason: text })}
                    placeholder={t('timeManagement.exceptionReasonPlaceholder')}
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    numberOfLines={3}
                  />

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: colors.backgroundSecondary }]}
                      onPress={() => {
                        Keyboard.dismiss();
                        setShowInlineTimePicker(null);
                        setShowExceptionModal(false);
                        setEditingException(null);
                        resetExceptionForm();
                      }}
                    >
                      <Text style={[styles.modalButtonText, { color: colors.text }]}>{t('common.cancel')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: colors.primary }]}
                      onPress={editingException ? handleUpdateException : handleCreateException}
                    >
                      <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                        {editingException ? t('timeManagement.update') : t('timeManagement.create')}
                      </Text>
                    </TouchableOpacity>
                  </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const renderTimePickerModal = () => {
    if (!timePickerConfig) return null;

    const timeSlots = generateTimeSlots();
    const fieldLabel = timePickerConfig.field === 'start' ? t('timeManagement.startTime') : t('timeManagement.endTime');

    return (
      <Modal
        visible={showTimePickerModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => {
          setShowTimePickerModal(false);
          setTimePickerConfig(null);
        }}
      >
        <Pressable
          style={styles.pickerModalOverlay}
          onPress={() => {
            setShowTimePickerModal(false);
            setTimePickerConfig(null);
          }}
        >
          <Pressable
            style={[styles.pickerModalContent, { backgroundColor: colors.card, maxHeight: '70%' }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={[styles.pickerModalTitle, { color: colors.text, marginBottom: 0 }]}>{t('timeManagement.selectField', { field: fieldLabel })}</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowTimePickerModal(false);
                  setTimePickerConfig(null);
                }}
              >
                <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>{t('common.done')}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={true}>
              {timeSlots.map((slot) => (
                <TouchableOpacity
                  key={slot.value}
                  style={[
                    styles.pickerItem,
                    {
                      backgroundColor: timePickerConfig.currentValue === slot.value ? colors.primaryLight : 'transparent',
                      borderBottomColor: colors.borderLight,
                    }
                  ]}
                  onPress={() => handleTimeSelect(slot.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.pickerItemName,
                    {
                      color: timePickerConfig.currentValue === slot.value ? colors.primary : colors.text,
                      fontWeight: timePickerConfig.currentValue === slot.value ? '600' : '400'
                    }
                  ]}>
                    {slot.label}
                  </Text>
                  {timePickerConfig.currentValue === slot.value && (
                    <CheckCircle size={18} color={colors.primary} strokeWidth={2} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    );
  };

  const renderInlineBlockTypePicker = () => {
    if (!showBlockTypeDropdown) return null;

    const blockTypes = [
      { value: 'unavailable', label: t('timeManagement.blockTypeUnavailable') },
      { value: 'meeting', label: t('timeManagement.blockTypeMeeting') },
      { value: 'surgery', label: t('timeManagement.blockTypeSurgery') },
      { value: 'conference', label: t('timeManagement.blockTypeConference') },
      { value: 'training', label: t('timeManagement.blockTypeTraining') },
      { value: 'not_in_clinic', label: t('timeManagement.blockTypeNotInClinic') },
      { value: 'other', label: t('timeManagement.blockTypeOther') },
    ];

    return (
      <View style={[styles.timeDropdown, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
        <ScrollView
          style={styles.timeDropdownScroll}
          nestedScrollEnabled
          showsVerticalScrollIndicator={true}
        >
          {blockTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.timeDropdownItem,
                {
                  backgroundColor: blockForm.block_type === type.value ? colors.primaryLight : 'transparent',
                  borderBottomColor: colors.borderLight,
                }
              ]}
              onPress={() => {
                setBlockForm({ ...blockForm, block_type: type.value });
                setShowBlockTypeDropdown(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.timeDropdownItemText, {
                color: blockForm.block_type === type.value ? colors.primary : colors.text,
                fontWeight: blockForm.block_type === type.value ? '600' : '400'
              }]}>
                {type.label}
              </Text>
              {blockForm.block_type === type.value && (
                <CheckCircle size={18} color={colors.primary} strokeWidth={2} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (loadingDoctors) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('timeManagement.loadingDoctors')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('timeManagement.title')}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.selectorsRow}>
          <View style={styles.selectorContainer}>
            <Text style={[styles.selectorLabel, { color: colors.textSecondary }]}>{t('timeManagement.doctorSelectorLabel')}</Text>
            <TouchableOpacity
              style={[styles.selector, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => setShowDoctorPicker(true)}
            >
              <User size={16} color={colors.text} strokeWidth={2} />
              <Text style={[styles.selectorText, { color: selectedDoctor ? colors.text : colors.textSecondary }]} numberOfLines={1}>
                {selectedDoctor ? t('timeManagement.doctorPrefix', { name: selectedDoctor.full_name }) : t('timeManagement.selectDoctorPlaceholder')}
              </Text>
              <ChevronDown size={16} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.selectorContainer}>
            <Text style={[styles.selectorLabel, { color: colors.textSecondary }]}>{t('timeManagement.clinicSelectorLabel')}</Text>
            <TouchableOpacity
              style={[styles.selector, { backgroundColor: colors.backgroundSecondary, opacity: selectedDoctor ? 1 : 0.5 }]}
              onPress={() => {
                if (!selectedDoctor) {
                  Alert.alert(t('timeManagement.selectDoctorFirstTitle'), t('timeManagement.selectDoctorBeforeClinic'));
                  return;
                }
                setShowClinicPicker(true);
              }}
            >
              <Building size={16} color={colors.text} strokeWidth={2} />
              <Text style={[styles.selectorText, { color: selectedClinic ? colors.text : colors.textSecondary }]} numberOfLines={1}>
                {selectedClinic?.name || t('timeManagement.selectClinicPlaceholder')}
              </Text>
              <ChevronDown size={16} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={[styles.tabBar, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'schedule' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('schedule')}
        >
          <Calendar size={16} color={activeTab === 'schedule' ? colors.primary : colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.tabText, { color: activeTab === 'schedule' ? colors.primary : colors.textSecondary }]}>
            {t('timeManagement.tabSchedule')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'exceptions' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('exceptions')}
        >
          <AlertCircle size={16} color={activeTab === 'exceptions' ? colors.primary : colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.tabText, { color: activeTab === 'exceptions' ? colors.primary : colors.textSecondary }]}>
            {t('timeManagement.tabExceptions')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'blocks' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('blocks')}
        >
          <Clock size={16} color={activeTab === 'blocks' ? colors.primary : colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.tabText, { color: activeTab === 'blocks' ? colors.primary : colors.textSecondary }]}>
            {t('timeManagement.tabBlockTimes')}
          </Text>
        </TouchableOpacity>
      </View>

      {!selectedDoctor || !selectedClinic ? (
        <View style={styles.emptyState}>
          {!selectedDoctor ? (
            <>
              <User size={48} color={colors.textTertiary} strokeWidth={1.5} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('timeManagement.selectADoctor')}</Text>
              <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
                {t('timeManagement.selectADoctorSubtext')}
              </Text>
            </>
          ) : (
            <>
              <Building size={48} color={colors.textTertiary} strokeWidth={1.5} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('timeManagement.selectAClinic')}</Text>
              <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
                {t('timeManagement.selectAClinicSubtext')}
              </Text>
            </>
          )}
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('timeManagement.loadingSchedule')}</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {activeTab === 'schedule' && renderWeeklySchedule()}
          {activeTab === 'exceptions' && renderExceptions()}
          {activeTab === 'blocks' && renderBlocks()}
        </ScrollView>
      )}

      {renderDoctorPickerModal()}
      {renderClinicPickerModal()}
      {renderScheduleModal()}
      {renderBlockModal()}
      {renderExceptionModal()}
      {renderTimePickerModal()}
    </SafeAreaView>
  );
}

const makeStyles = (P: DoctorPalette) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: P.softBorder,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  selectorsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  selectorContainer: {
    flex: 1,
  },
  selectorLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  selectorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: P.border,
    backgroundColor: P.cardBg,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
    gap: 12,
  },
  clinicSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
  },
  clinicTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: P.border,
  },
  clinicSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  scheduleCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
  },
  noScheduleText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  scheduleItem: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    gap: 6,
  },
  scheduleTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scheduleTime: {
    fontSize: 14,
    fontWeight: '600',
  },
  clinicContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clinicText: {
    fontSize: 13,
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyPickerState: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyPickerText: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 8,
  },
  emptyPickerSubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
  exceptionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  exceptionHeader: {
    marginBottom: 12,
  },
  exceptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  exceptionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  exceptionContent: {
    gap: 8,
  },
  exceptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exceptionDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  exceptionTime: {
    fontSize: 14,
  },
  exceptionClinic: {
    fontSize: 14,
  },
  exceptionReason: {
    fontSize: 13,
    marginTop: 4,
    fontStyle: 'italic',
  },
  blockCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  blockHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  blockIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  blockDate: {
    fontSize: 15,
    fontWeight: '600',
  },
  blockActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockContent: {
    gap: 8,
    paddingLeft: 14,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blockTime: {
    fontSize: 14,
  },
  blockClinic: {
    fontSize: 14,
  },
  blockReason: {
    fontSize: 13,
    marginTop: 4,
    fontStyle: 'italic',
  },
  appointmentCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appointmentPatient: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  appointmentDetails: {
    gap: 6,
  },
  appointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appointmentText: {
    fontSize: 13,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: P.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: SCREEN_WIDTH < 768 ? '90%' : 500,
    borderRadius: 16,
    padding: 0,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: SCREEN_WIDTH < 768 ? 22 : 19,
    fontWeight: 'bold',
    marginBottom: SCREEN_WIDTH < 768 ? 20 : 16,
  },
  label: {
    fontSize: SCREEN_WIDTH < 768 ? 14 : 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: SCREEN_WIDTH < 768 ? 12 : 10,
  },
  pickerContainer: {
    gap: 8,
  },
  clinicOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
  },
  clinicOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderRadius: 8,
    padding: SCREEN_WIDTH < 768 ? 14 : 10,
    fontSize: SCREEN_WIDTH < 768 ? 15 : 14,
    minHeight: SCREEN_WIDTH < 768 ? 48 : 40,
  },
  timeInput: {
    borderWidth: 1,
    borderStyle: 'solid',
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  timeRow: {
    flexDirection: 'row',
    gap: SCREEN_WIDTH < 768 ? 8 : 10,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SCREEN_WIDTH < 768 ? 16 : 12,
    marginTop: SCREEN_WIDTH < 768 ? 24 : 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SCREEN_WIDTH < 768 ? 15 : 11,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: SCREEN_WIDTH < 768 ? 50 : 40,
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: SCREEN_WIDTH < 768 ? 17 : 16,
    fontWeight: '600',
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: P.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModalContent: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '80%',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: P.softBorder,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 12,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pickerModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  pickerSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  pickerList: {
    maxHeight: 400,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 4,
  },
  pickerItemInfo: {
    flex: 1,
  },
  pickerItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  pickerItemSubtext: {
    fontSize: 13,
  },
  timeDropdown: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    maxHeight: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  timeDropdownScroll: {
    maxHeight: 240,
  },
  timeDropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  timeDropdownItemText: {
    fontSize: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: P.softBorder,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  scheduleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  scheduleTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  timeField: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: P.inputBg,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '600',
  },
  dayOffText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
  },
  blockMainContent: {
    flexDirection: 'row',
    gap: 12,
  },
  blockIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockInfo: {
    flex: 1,
  },
  blockTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  blockActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockDateText: {
    fontSize: 15,
    fontWeight: '600',
  },
  blockTimeRange: {
    fontSize: 13,
    marginBottom: 6,
  },
  blockReasonText: {
    fontSize: 14,
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  exceptionDateRange: {
    fontSize: 15,
    fontWeight: '600',
  },
  exceptionReasonText: {
    fontSize: 14,
    marginBottom: 8,
  },
  durationBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
