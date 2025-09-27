export default defineAppConfig({
  pages: [
    "pages/auth/login/index",
    "pages/index/index",
    "pages/products/index",
    "pages/products/detail/index",
    "pages/checkout/index",
    "pages/order-confirm/index",
    "pages/booking/select",
    "pages/booking-confirm/index",
    "pages/my/index",
    "pages/my/orders/index",
    "pages/my/bookings/index",
    "pages/search/index",
  ],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#ffffff",
    navigationBarTitleText: "MiniModules",
    navigationBarTextStyle: "black",
  },
})
