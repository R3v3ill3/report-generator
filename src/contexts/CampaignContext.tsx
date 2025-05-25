import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types
export interface ContactDetails {
  organizationName: string;
  contactPerson: string;
  email: string;
  phone: string;
  website: string;
}

export interface ReportOptions {
  reportType: 'combined' | 'separate';
  logoDataUrl: string | null;
  contactDetails: ContactDetails;
}

export interface CampaignData {
  id?: string;
  summary?: {
    purpose: string;
    [key: string]: any;
  };
  messagingGuide?: string;
  step1Analysis?: string;
  actionPlan?: string;
  executiveSummary?: string;
  [key: string]: any;
}

interface CampaignContextType {
  campaignData: CampaignData | null;
  setCampaignData: (data: CampaignData | null) => void;
  updateCampaignData: (updates: Partial<CampaignData>) => void;
  reportOptions: ReportOptions | null;
  setReportOptions: (options: ReportOptions) => void;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export const CampaignProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [campaignData, setCampaignData] = useState<CampaignData | null>(null);
  const [reportOptions, setReportOptions] = useState<ReportOptions | null>(null);
  
  const updateCampaignData = (updates: Partial<CampaignData>) => {
    setCampaignData(prevData => {
      if (!prevData) return updates as CampaignData;
      return { ...prevData, ...updates };
    });
  };
  
  return (
    <CampaignContext.Provider
      value={{
        campaignData,
        setCampaignData,
        updateCampaignData,
        reportOptions,
        setReportOptions,
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
};

export const useCampaign = (): CampaignContextType => {
  const context = useContext(CampaignContext);
  if (context === undefined) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }
  return context;
};