import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import QrLinkScanner, { QrScannerErrorInfo } from '@/components/QrLinkScanner';

// Doctor → clinic linking. Identical flow to the patient scanner, swapping only:
//   endpoint        redeem-qr-token        -> redeem-qr-user-token
//   identity field  medical_id (patient)   -> global_id (doctor, from session)
//   success refresh patient's clinics      -> doctor's linked-clinics (on focus)
// global_id is read from the authenticated doctor's session — never typed/scanned.

export default function DoctorLinkClinicScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { t } = useTranslation();

  const ERROR_COPY: Record<string, QrScannerErrorInfo> = {
    expired: {
      title: t('linkProvider.errors.qrExpiredTitle'),
      message: t('linkProvider.errors.qrExpiredMessage'),
      canRetry: true,
    },
    used: {
      title: t('linkProvider.errors.qrUsedTitle'),
      message: t('linkProvider.errors.qrUsedMessage'),
      canRetry: true,
    },
    invalid_token: {
      title: t('linkProvider.errors.qrInvalidTitle'),
      message: t('linkProvider.errors.qrInvalidMessage'),
      canRetry: true,
    },
    wrong_kind: {
      title: t('linkProvider.errors.wrongKindTitle'),
      message: t('linkProvider.errors.wrongKindMessage'),
      canRetry: true,
    },
    user_not_found: {
      title: t('linkProvider.errors.userNotFoundTitle'),
      message: t('linkProvider.errors.userNotFoundMessage'),
      canRetry: false,
    },
    network: {
      title: t('linkProvider.errors.networkTitle'),
      message: t('linkProvider.errors.doctorNetworkMessage'),
      canRetry: true,
      retryMode: 'resend', // re-send the same token, don't re-scan
    },
    unknown: {
      title: t('linkProvider.errors.unknownTitle'),
      message: t('linkProvider.errors.unknownMessage'),
      canRetry: true,
    },
  };

  // Navigating back to the doctor tabs re-triggers the home screen's
  // useFocusEffect, which reloads the linked-clinics list.
  const onFinish = useCallback(() => {
    router.replace('/(doctor-tabs)');
  }, [router]);

  return (
    <QrLinkScanner
      endpoint="redeem-qr-user-token"
      identityField="global_id"
      identityValue={session?.user?.global_id}
      sendApikeyHeader
      nameKeys={['clinic_name', 'company_name', 'clinic']}
      nameFallback={t('linkProvider.nameFallbackClinic')}
      errorCopy={ERROR_COPY}
      missingIdentityCode="user_not_found"
      onFinish={onFinish}
      text={{
        headerTitle: t('linkProvider.doctor.headerTitle'),
        cameraTitle: t('linkProvider.doctor.cameraTitle'),
        cameraHint: t('linkProvider.doctor.cameraHint'),
        webBody: t('linkProvider.doctor.webBody'),
        permissionBody: t('linkProvider.doctor.permissionBody'),
        confirmTitle: t('linkProvider.doctor.confirmTitle'),
        confirmBody: t('linkProvider.doctor.confirmBody'),
        noticeText: t('linkProvider.doctor.noticeText'),
        linkingBody: t('linkProvider.doctor.linkingBody'),
        successLinkedTitle: t('linkProvider.doctor.successLinkedTitle'),
        successAlreadyTitle: t('linkProvider.doctor.successAlreadyTitle'),
        successLinkedMessage: (name) =>
          t('linkProvider.doctor.successLinkedMessage', { name }),
        successAlreadyMessage: () =>
          t('linkProvider.doctor.successAlreadyMessage'),
      }}
    />
  );
}
