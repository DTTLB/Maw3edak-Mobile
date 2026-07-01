import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import QrLinkScanner, { QrScannerErrorInfo } from '@/components/QrLinkScanner';

// Patient → clinic linking. Reads the patient's own medical_id from the session
// and calls redeem-qr-token. See components/QrLinkScanner for the shared flow.

export default function LinkProviderScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { t } = useTranslation();

  const ERROR_COPY: Record<string, QrScannerErrorInfo> = {
    expired: {
      title: t('linkProvider.errors.expiredTitle'),
      message: t('linkProvider.errors.expiredMessage'),
      canRetry: true,
    },
    used: {
      title: t('linkProvider.errors.usedTitle'),
      message: t('linkProvider.errors.usedMessage'),
      canRetry: true,
    },
    invalid_token: {
      title: t('linkProvider.errors.invalidTokenTitle'),
      message: t('linkProvider.errors.invalidTokenMessage'),
      canRetry: true,
    },
    patient_not_found: {
      title: t('linkProvider.errors.patientNotFoundTitle'),
      message: t('linkProvider.errors.patientNotFoundMessage'),
      canRetry: false,
    },
    network: {
      title: t('linkProvider.errors.networkTitle'),
      message: t('linkProvider.errors.networkMessage'),
      canRetry: true,
    },
    unknown: {
      title: t('linkProvider.errors.unknownTitle'),
      message: t('linkProvider.errors.unknownMessage'),
      canRetry: true,
    },
  };

  const onFinish = useCallback(() => {
    router.replace('/(tabs)');
  }, [router]);

  return (
    <QrLinkScanner
      endpoint="redeem-qr-token"
      identityField="medical_id"
      identityValue={session?.patient?.medical_id}
      nameKeys={['company_name']}
      nameFallback={t('linkProvider.nameFallbackProvider')}
      errorCopy={ERROR_COPY}
      missingIdentityCode="patient_not_found"
      onFinish={onFinish}
      text={{
        headerTitle: t('linkProvider.patient.headerTitle'),
        cameraTitle: t('linkProvider.patient.cameraTitle'),
        cameraHint: t('linkProvider.patient.cameraHint'),
        webBody: t('linkProvider.patient.webBody'),
        permissionBody: t('linkProvider.patient.permissionBody'),
        confirmTitle: t('linkProvider.patient.confirmTitle'),
        confirmBody: t('linkProvider.patient.confirmBody'),
        noticeText: t('linkProvider.patient.noticeText'),
        linkingBody: t('linkProvider.patient.linkingBody'),
        successLinkedTitle: t('linkProvider.patient.successLinkedTitle'),
        successAlreadyTitle: t('linkProvider.patient.successAlreadyTitle'),
        successLinkedMessage: (name) =>
          t('linkProvider.patient.successLinkedMessage', { name }),
        successAlreadyMessage: (name) =>
          t('linkProvider.patient.successAlreadyMessage', { name }),
      }}
    />
  );
}
