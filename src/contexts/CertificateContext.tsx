import React, { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { CertificateData } from '@/lib/certificateGenerator';
import type { ExamType } from '@/lib/exams';

export type { ExamType };

interface CertificateContextType {
  certificates: CertificateData[];
  setCertificates: (data: CertificateData[]) => void;
  clearCertificates: () => void;
  examType: ExamType;
  setExamType: (type: ExamType) => void;
  /** Imagens trocadas pela engrenagem nesta sessão: caminho original → URL local. */
  assetOverrides: Record<string, string>;
  setAssetOverrides: (overrides: Record<string, string>) => void;
  clearAssetOverrides: () => void;
}

const CertificateContext = createContext<CertificateContextType | undefined>(undefined);

export const CertificateProvider = ({ children }: { children: ReactNode }) => {
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [examType, setExamType] = useState<ExamType>('STARTERS');
  const [assetOverrides, setOverrides] = useState<Record<string, string>>({});

  const clearCertificates = () => setCertificates([]);

  const setAssetOverrides = useCallback((next: Record<string, string>) => {
    setOverrides((prev) => {
      // Libera a memória das imagens que foram substituídas de novo
      for (const [path, url] of Object.entries(prev)) {
        if (next[path] && next[path] !== url) URL.revokeObjectURL(url);
      }
      return { ...prev, ...next };
    });
  }, []);

  const clearAssetOverrides = useCallback(() => {
    setOverrides((prev) => {
      Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
      return {};
    });
  }, []);

  return (
    <CertificateContext.Provider
      value={{
        certificates,
        setCertificates,
        clearCertificates,
        examType,
        setExamType,
        assetOverrides,
        setAssetOverrides,
        clearAssetOverrides,
      }}
    >
      {children}
    </CertificateContext.Provider>
  );
};

export const useCertificates = () => {
  const context = useContext(CertificateContext);
  if (!context) {
    throw new Error('useCertificates must be used within CertificateProvider');
  }
  return context;
};
