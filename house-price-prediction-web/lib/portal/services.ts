import type { AdviceItem, PortalApp, PortalApplicationsData, PortalHomeData, RecentActivity } from "./types";

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const MOCK_APPLICATIONS: PortalApp[] = [
  {
    id: "app-valuation",
    key: "valuation",
    name: "House Price Valuation Application",
    description: "Estimate housing prices based on multidimensional property information.",
    icon: "valuation",
    category: "valuation",
    href: "/valuation",
    lastUsedAt: "2026-05-17T08:25:00.000Z",
  },
  {
    id: "app-analysis",
    key: "analysis",
    name: "House Price Analysis Application",
    description: "Create comparison views and visualize property price estimation cases.",
    icon: "analysis",
    category: "analysis",
    href: "/analysis?tab=dashboard",
    lastUsedAt: "2026-05-16T03:20:00.000Z",
  },
  {
    id: "app-market-insights",
    key: "market-insights",
    name: "Market Insights",
    description: "Review neighborhood trends, volume, and median price movement.",
    icon: "insights",
    category: "analysis",
    href: "/valuation?view=insights",
  },
  {
    id: "app-forecast",
    key: "forecast",
    name: "Price Forecast",
    description: "Predict short and mid-term house price movement by district.",
    icon: "forecast",
    category: "monitoring",
    href: "/valuation?view=forecast",
  },
  {
    id: "app-compare",
    key: "compare",
    name: "Property Compare",
    description: "Compare up to five properties and inspect key valuation factors.",
    icon: "compare",
    category: "analysis",
    href: "/valuation?view=compare",
  },
  {
    id: "app-reporting",
    key: "reporting",
    name: "Prediction Reports",
    description: "Access generated valuation reports and export snapshots.",
    icon: "reports",
    category: "monitoring",
    href: "/valuation?view=reports",
  },
];

const MOCK_RECENT: RecentActivity[] = [
  {
    id: "recent-1",
    title: "London House Prediction",
    location: "Yubei District",
    predictionId: "PD-256",
    date: "2026-05-26",
    reopenHref: "/valuation?predictionId=PD-256",
  },
  {
    id: "recent-2",
    title: "Downtown Apartment Prediction",
    location: "Jiangbei District",
    predictionId: "PD-240",
    date: "2026-05-19",
    reopenHref: "/valuation?predictionId=PD-240",
  },
];

export async function getPortalHomeData(): Promise<PortalHomeData> {
  const [shortcuts, advices, recentActivities] = await Promise.all([
    getPortalShortcuts(),
    getPortalAdvices(),
    getPortalRecentActivities(),
  ]);

  return { shortcuts, advices, recentActivities };
}

export async function getPortalShortcuts(): Promise<PortalApp[]> {
  await wait(220);
  return MOCK_APPLICATIONS.filter((app) => app.key === "valuation" || app.key === "analysis");
}

export async function getPortalAdvices(): Promise<AdviceItem[]> {
  await wait(250);
  return [
    {
      id: "advice-valuation",
      title: "Need to conduct a house price analysis?",
      content:
        "Use valuation workflows to estimate prices, compare cases, and visualize key market drivers.",
      actionText: "Prediction Now",
      actionHref: "/valuation",
    },
    {
      id: "advice-market",
      title: "Is a property market analysis needed?",
      content:
        "Open market insights to review district-level movement before finalizing the valuation strategy.",
      actionText: "Analysis Now",
      actionHref: "/analysis?tab=dashboard",
    },
  ];
}

export async function getPortalRecentActivities(): Promise<RecentActivity[]> {
  await wait(270);
  return MOCK_RECENT;
}

export async function getPortalApplications(options?: {
  keyword?: string;
  category?: string;
}): Promise<PortalApplicationsData> {
  await wait(300);

  const keyword = options?.keyword?.trim().toLowerCase() ?? "";
  const category = options?.category?.trim().toLowerCase() ?? "";

  let items = MOCK_APPLICATIONS.filter((app) => app.key === "valuation" || app.key === "analysis");

  if (category) {
    items = items.filter((item) => item.category.toLowerCase() === category);
  }

  if (keyword) {
    items = items.filter((item) => {
      const text = `${item.name} ${item.description}`.toLowerCase();
      return text.includes(keyword);
    });
  }

  return {
    applications: items,
    total: items.length,
  };
}
