export interface TenantConfigDto {
  tenantId?: string;
  industry?: string;
  theme?: {
    primaryColor?: string;
    buttonRadius?: number;
    logo?: string;
    name?: string;
  };
  enabledModules?: string[];
  i18n?: {
    locale?: string;
  };
  modules?: {
    ordering?: {
      mode?: string;
      specSchema?: string;
      minOrderAmount?: number;
      packageFee?: number;
      tableNumberRequired?: boolean;
      showSpicyLevel?: boolean;
      showCalories?: boolean;
    };
    booking?: {
      slotMinutes?: number;
      maxBookableDays?: number;
      cancelPolicy?: string;
      checkinMethod?: string;
    };
    ecommerce?: {
      shippingTemplate?: string;
      freeShippingThreshold?: number;
      priceDisplay?: string;
      promotion?: {
        coupon?: boolean;
        fullReduction?: boolean;
        flashSale?: boolean;
      };
    };
    ticketing?: {
      entryWindow?: {
        beforeEvent?: number;
        afterEvent?: number;
      };
      refundPolicy?: string;
      qrCodeStyle?: {
        size?: number;
        color?: string;
      };
    };
    subscription?: {
      tiers?: Array<{
        id?: string;
        name?: string;
        price?: number;
        benefits?: string[];
      }>;
      period?: string;
      renewalNoticeDays?: number;
    };
    cms?: {
      categoryStructure?: {
        banners?: string[];
        announcements?: string[];
        activities?: string[];
        articles?: string[];
      };
      jumpStrategy?: {
        bannerJump?: string;
        articleJump?: string;
      };
    };
  };
  ui?: {
    homepageLayout?: string;
    showSearch?: boolean;
    cardStyle?: string;
    imageAspectRatio?: string;
  };
}
