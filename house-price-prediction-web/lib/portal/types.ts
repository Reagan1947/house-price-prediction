export type PortalApp = {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: "valuation" | "analysis" | "insights" | "forecast" | "compare" | "reports";
  category: "valuation" | "analysis" | "monitoring";
  href: string;
  isExternal?: boolean;
  lastUsedAt?: string;
};

export type AdviceItem = {
  id: string;
  title: string;
  content: string;
  actionText: string;
  actionHref: string;
};

export type RecentActivity = {
  id: string;
  title: string;
  location: string;
  predictionId: string;
  date: string;
  reopenHref: string;
};

export type PortalHomeData = {
  shortcuts: PortalApp[];
  advices: AdviceItem[];
  recentActivities: RecentActivity[];
};

export type PortalApplicationsData = {
  applications: PortalApp[];
  total: number;
};
