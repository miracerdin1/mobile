import { Linking, Platform } from "react-native";
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
  PurchasesError,
  PurchasesPackage,
} from "react-native-purchases";
import Config from "../constants/Config";
import { StoreBillingUser, StorePlan, StorePlanOption } from "../types/payment";
import apiClient from "./api";

export const DEFAULT_STORE_PLAN_OPTIONS: StorePlanOption[] = [
  {
    plan: "monthly",
    title: "Aylık Plan",
    price: "Mağaza fiyatı",
    period: "",
  },
  {
    plan: "yearly",
    title: "Yıllık Plan",
    price: "Mağaza fiyatı",
    period: "",
    badge: "EN POPÜLER",
  },
];

let configuredUserId: string | null = null;

const getRevenueCatApiKey = () => {
  if (Platform.OS === "ios") return Config.REVENUECAT_IOS_API_KEY;
  if (Platform.OS === "android") return Config.REVENUECAT_ANDROID_API_KEY;

  return "";
};

const getUserId = (user: StoreBillingUser | null) => user?.id || user?._id || null;

const hasActiveProEntitlement = (customerInfo: CustomerInfo) =>
  Boolean(customerInfo.entitlements.active[Config.REVENUECAT_ENTITLEMENT_ID]);

const getPackageType = (plan: StorePlan) =>
  plan === "monthly" ? PACKAGE_TYPE.MONTHLY : PACKAGE_TYPE.ANNUAL;

const getPackageForPlan = (packages: PurchasesPackage[], plan: StorePlan) => {
  const packageType = getPackageType(plan);

  return packages.find((item) => item.packageType === packageType) || null;
};

const mapPackageToPlanOption = (
  packages: PurchasesPackage[],
  fallback: StorePlanOption,
) => {
  const storePackage = getPackageForPlan(packages, fallback.plan);
  if (!storePackage) return fallback;

  return {
    ...fallback,
    price: storePackage.product.priceString,
  };
};

export const isStoreBillingConfigured = () => Boolean(getRevenueCatApiKey());

export const ensureStoreBillingConfigured = async (user: StoreBillingUser | null) => {
  const userId = getUserId(user);
  if (!userId) {
    throw new Error("Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.");
  }

  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    throw new Error("Mağaza ödeme anahtarları yapılandırılmamış.");
  }

  if (Platform.OS === "web") {
    throw new Error("Mağaza içi satın alma web ortamında desteklenmiyor.");
  }

  const isConfigured = await Purchases.isConfigured().catch(() => false);
  if (!isConfigured) {
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
    Purchases.configure({ apiKey, appUserID: userId });
    configuredUserId = userId;
    return;
  }

  if (configuredUserId !== userId) {
    await Purchases.logIn(userId);
    
    if (user?.email) {
      await Purchases.setEmail(user.email);
    }
    
    if (user?.username) {
      await Purchases.setDisplayName(user.username);
    }

    configuredUserId = userId;
  }
};

export const loadStorePlanOptions = async (
  user: StoreBillingUser | null,
): Promise<StorePlanOption[]> => {
  await ensureStoreBillingConfigured(user);

  const offerings = await Purchases.getOfferings();
  const packages = offerings.current?.availablePackages || [];

  return DEFAULT_STORE_PLAN_OPTIONS.map((option) =>
    mapPackageToPlanOption(packages, option),
  );
};

export const syncRevenueCatPlan = async () => {
  const response = await apiClient.post("/api/payments/sync-revenuecat");

  return response.data.user;
};

export const purchaseProPlan = async (
  user: StoreBillingUser | null,
  plan: StorePlan,
) => {
  await ensureStoreBillingConfigured(user);

  const offerings = await Purchases.getOfferings();
  const storePackage = getPackageForPlan(
    offerings.current?.availablePackages || [],
    plan,
  );

  if (!storePackage) {
    throw new Error("Seçilen Pro plan mağaza ürünlerinde bulunamadı.");
  }

  const { customerInfo } = await Purchases.purchasePackage(storePackage);
  if (!hasActiveProEntitlement(customerInfo)) {
    throw new Error("Satın alma tamamlandı ancak Pro yetkisi doğrulanamadı.");
  }

  return syncRevenueCatPlan();
};

export const restoreProPurchase = async (user: StoreBillingUser | null) => {
  await ensureStoreBillingConfigured(user);

  const customerInfo = await Purchases.restorePurchases();
  if (!hasActiveProEntitlement(customerInfo)) {
    throw new Error("Bu hesap için aktif Pro satın alımı bulunamadı.");
  }

  return syncRevenueCatPlan();
};

export const isPurchaseCancelled = (error: unknown) => {
  const purchaseError = error as PurchasesError;

  return (
    purchaseError?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR ||
    purchaseError?.userCancelled === true
  );
};

export const getStoreBillingErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) return error.message;

  const purchaseError = error as PurchasesError;
  if (purchaseError?.message) return purchaseError.message;

  return "Satın alma işlemi tamamlanamadı.";
};

export const manageStoreSubscription = async (user: StoreBillingUser | null) => {
  await ensureStoreBillingConfigured(user);

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const managementURL = customerInfo.managementURL;

    if (managementURL) {
      const supported = await Linking.canOpenURL(managementURL);
      if (supported) {
        await Linking.openURL(managementURL);
        return;
      }
    }
  } catch (error) {
    console.error("Failed to get customer info for management url", error);
  }

  // Fallbacks if no URL is returned or fails to open
  if (Platform.OS === "ios") {
    await Linking.openURL("https://apps.apple.com/account/subscriptions");
  } else if (Platform.OS === "android") {
    await Linking.openURL("https://play.google.com/store/account/subscriptions");
  } else {
    throw new Error("Abonelik yönetimi bu platformda desteklenmiyor.");
  }
};
